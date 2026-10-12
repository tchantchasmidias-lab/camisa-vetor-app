import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { MercadoPagoConfig, Payment, PreApproval } from 'mercadopago';
import { Timestamp } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebaseAdmin';
import { BILLING_CYCLE_DAYS, PLANS, isPaidPlan, toMillis, type PaidPlan } from '@/lib/subscriptions';
import {
  activatePixSubscriptionPass,
  extractSubscriptionPassInfo,
} from '@/lib/subscriptionServer';

/**
 * Webhook de assinaturas do Mercado Pago.
 * Eventos tratados: `payment` (cobrança recorrente ou Passe Pix) e `subscription_preapproval` (ciclo de vida).
 * Nunca confiamos no corpo recebido: o estado real é sempre consultado na API do Mercado Pago.
 */

interface SubRef {
  uid: string;
  plan: PaidPlan;
}

function parseExternalReference(ref?: string | null): SubRef | null {
  if (!ref || !ref.startsWith('sub|')) return null;
  const [, uid, plan] = ref.split('|');
  if (!uid || !isPaidPlan(plan)) return null;
  return { uid, plan };
}

/** Valida a assinatura x-signature quando MERCADOPAGO_WEBHOOK_SECRET estiver configurado. */
function isSignatureValid(req: NextRequest, dataId: string | null): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret) return true;
  const signature = req.headers.get('x-signature');
  const requestId = req.headers.get('x-request-id') || '';
  if (!signature || !dataId) return false;

  const parts = Object.fromEntries(
    signature.split(',').map((p) => {
      const [k, v] = p.split('=');
      return [k?.trim(), v?.trim()];
    })
  );
  if (!parts.ts || !parts.v1) return false;

  const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${parts.ts};`;
  const expected = crypto.createHmac('sha256', secret).update(manifest).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(parts.v1));
  } catch {
    return false;
  }
}

async function handleApprovedPayment(paymentId: string, ref: SubRef, preapprovalId?: string) {
  const userRef = adminDb.collection('users').doc(ref.uid);
  const markerRef = adminDb.collection('subscription_payments').doc(paymentId);
  const plan = PLANS[ref.plan];

  await adminDb.runTransaction(async (tx) => {
    const [marker, userSnap] = await Promise.all([tx.get(markerRef), tx.get(userRef)]);
    if (marker.exists) return; // idempotência: pagamento já processado

    const userData = userSnap.data() || {};
    const lastActivatedMs = toMillis(userData.lastSubscriptionActivatedAt);
    const isInitialChargeAlreadyCredited =
      preapprovalId &&
      userData.subscriptionId === preapprovalId &&
      lastActivatedMs !== null &&
      Date.now() - lastActivatedMs < 24 * 3600_000;

    if (isInitialChargeAlreadyCredited) {
      // A ativação transparente imediata já creditou o ciclo inicial; apenas registra o paymentId
      tx.set(markerRef, {
        uid: ref.uid,
        plan: ref.plan,
        preapprovalId,
        note: 'initial_charge_already_credited',
        processedAt: Timestamp.now(),
      });
      return;
    }

    const renewsAt = Timestamp.fromMillis(Date.now() + BILLING_CYCLE_DAYS * 86_400_000);
    tx.set(
      userRef,
      {
        isSubscriber: true,
        subscriptionPlan: ref.plan,
        subscriptionStatus: 'active',
        subscriptionId: preapprovalId || userData.subscriptionId || '',
        subscriptionRenewsAt: renewsAt,
        subscriptionExpiresAt: renewsAt,
        monthlyCredits: plan.credits,
        availableCredits: plan.credits,
      },
      { merge: true }
    );
    tx.set(markerRef, { uid: ref.uid, plan: ref.plan, processedAt: Timestamp.now() });
  });
}

async function markCanceled(uid: string, expectedSubscriptionId?: string) {
  const userRef = adminDb.collection('users').doc(uid);
  await adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(userRef);
    const data = snap.data();
    if (!data) return;
    if (expectedSubscriptionId && data.subscriptionId && data.subscriptionId !== expectedSubscriptionId) return;
    tx.set(userRef, { subscriptionStatus: 'canceled' }, { merge: true });
  });
}

export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const body = await req.json().catch(() => ({}));

    const type: string | undefined =
      body?.type ||
      body?.topic ||
      url.searchParams.get('type') ||
      url.searchParams.get('topic') ||
      undefined;
    const dataId: string | null =
      body?.data?.id?.toString() ||
      url.searchParams.get('data.id') ||
      url.searchParams.get('id') ||
      (body?.id ? String(body.id) : null);

    if (!type || !dataId) return NextResponse.json({ ignored: true });
    if (!isSignatureValid(req, url.searchParams.get('data.id') || dataId)) {
      return NextResponse.json({ error: 'Assinatura inválida' }, { status: 401 });
    }

    if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
      console.error('[Webhook Sub] MERCADOPAGO_ACCESS_TOKEN não configurado');
      return NextResponse.json({ error: 'Token MP não configurado' }, { status: 500 });
    }
    const client = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN });

    // ── Ciclo de vida da assinatura ────────────────────────────────────────────
    if (type === 'subscription_preapproval') {
      const pre = await new PreApproval(client).get({ id: dataId });
      const ref = parseExternalReference(pre.external_reference);
      if (!ref) return NextResponse.json({ ignored: true });

      if (pre.status === 'cancelled') {
        await markCanceled(ref.uid, dataId);
      } else if (pre.status === 'paused') {
        const userRef = adminDb.collection('users').doc(ref.uid);
        const snap = await userRef.get();
        if (snap.data()?.subscriptionId === dataId) {
          await userRef.set({ subscriptionStatus: 'paused' }, { merge: true });
        }
      } else if (pre.status === 'authorized') {
        const userRef = adminDb.collection('users').doc(ref.uid);
        await userRef.set(
          {
            subscriptionId: dataId,
            subscriptionPlan: ref.plan,
            subscriptionStatus: 'active',
            monthlyCredits: PLANS[ref.plan].credits,
          },
          { merge: true }
        );
      }
      return NextResponse.json({ received: true });
    }

    // ── Cobranças recorrentes ou Passe Pix de 30 Dias ──────────────────────────
    if (type === 'payment') {
      const payment = await new Payment(client).get({ id: dataId });

      // 1) Verifica se é um Passe de 30 Dias pago via Pix
      const passInfo = extractSubscriptionPassInfo(payment);
      if (passInfo) {
        if (payment.status === 'approved') {
          await activatePixSubscriptionPass(String(payment.id ?? dataId), passInfo);
        }
        return NextResponse.json({ received: true, subscriptionPass: true });
      }

      // 2) Cobrança recorrente de cartão (PreApproval)
      const preapprovalId: string | undefined = (payment as any).metadata?.preapproval_id || undefined;

      let ref = parseExternalReference(payment.external_reference);
      if (!ref && preapprovalId) {
        const pre = await new PreApproval(client).get({ id: preapprovalId });
        ref = parseExternalReference(pre.external_reference);
      }
      if (!ref) return NextResponse.json({ ignored: true });

      if (payment.status === 'approved') {
        await handleApprovedPayment(String(payment.id ?? dataId), ref, preapprovalId);
      } else if (payment.status === 'rejected' || payment.status === 'cancelled') {
        await markCanceled(ref.uid, preapprovalId);
      }
      return NextResponse.json({ received: true });
    }

    return NextResponse.json({ ignored: true });
  } catch (error: any) {
    console.error('[Webhook Sub] erro:', error?.message);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
