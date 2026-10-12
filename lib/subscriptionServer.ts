import { Timestamp } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebaseAdmin';
import {
  BILLING_CYCLE_DAYS,
  PLANS,
  hasActiveEntitlement,
  isPaidPlan,
  type PaidPlan,
} from '@/lib/subscriptions';

export interface SubscriptionPassInfo {
  userId: string;
  planId: PaidPlan;
}

/**
 * Extrai { userId, planId } de um pagamento do Mercado Pago se ele for um Passe de 30 Dias (Pix).
 * Suporta tanto metadata (camelCase ou snake_case do MP) quanto external_reference ("subpass|uid|plan|tx").
 */
export function extractSubscriptionPassInfo(payment: any): SubscriptionPassInfo | null {
  if (!payment) return null;

  const meta = payment.metadata || {};
  const metaType = meta.type || meta.payment_type;
  const metaPlan = meta.planId || meta.plan_id;
  const metaUser = meta.userId || meta.user_id;

  if (metaType === 'subscription_pass' && metaUser && isPaidPlan(metaPlan)) {
    return { userId: String(metaUser), planId: metaPlan };
  }

  const extRef = String(payment.external_reference || '');
  if (extRef.startsWith('subpass|')) {
    const parts = extRef.split('|');
    const uid = parts[1];
    const plan = parts[2];
    if (uid && isPaidPlan(plan)) {
      return { userId: uid, planId: plan };
    }
  }

  return null;
}

/**
 * Ativa (de forma idempotente via transação no Firestore) um Passe de 30 Dias pago via Pix.
 * Soma +15 (PRO) ou +40 (Gráfica) aos créditos válidos do usuário e define validade de 30 dias.
 */
export async function activatePixSubscriptionPass(
  paymentId: string | number,
  info: SubscriptionPassInfo
): Promise<{ alreadyProcessed: boolean; availableCredits: number }> {
  const pid = String(paymentId);
  const userRef = adminDb.collection('users').doc(info.userId);
  const markerRef = adminDb.collection('subscription_payments').doc(`pix_${pid}`);
  const plan = PLANS[info.planId];

  return adminDb.runTransaction(async (tx) => {
    const [markerSnap, userSnap] = await Promise.all([tx.get(markerRef), tx.get(userRef)]);
    const userData = userSnap.data() || {};

    if (markerSnap.exists) {
      return {
        alreadyProcessed: true,
        availableCredits: Number(userData.availableCredits) || plan.credits,
      };
    }

    const nowMs = Date.now();
    const currentlyActive = hasActiveEntitlement(userData, nowMs);
    const baseCredits = currentlyActive ? Math.max(0, Number(userData.availableCredits) || 0) : 0;
    const newCredits = baseCredits + plan.credits;
    const expiresAt = Timestamp.fromMillis(nowMs + BILLING_CYCLE_DAYS * 86_400_000);

    tx.set(
      userRef,
      {
        isSubscriber: true,
        subscriptionPlan: plan.id,
        subscriptionStatus: 'active',
        subscriptionId: `pix_${pid}`,
        subscriptionExpiresAt: expiresAt,
        subscriptionRenewsAt: expiresAt,
        monthlyCredits: plan.credits,
        availableCredits: newCredits,
      },
      { merge: true }
    );

    tx.set(markerRef, {
      uid: info.userId,
      plan: plan.id,
      method: 'pix_pass',
      paymentId: pid,
      creditsAdded: plan.credits,
      processedAt: Timestamp.now(),
    });

    return { alreadyProcessed: false, availableCredits: newCredits };
  });
}

/**
 * Ativa imediatamente a assinatura recorrente de cartão assim que o PreApproval é autorizado.
 * Usa marcador idempotente por subscriptionId para não duplicar créditos com o webhook inicial.
 */
export async function activateAuthorizedCardSubscription(
  uid: string,
  planId: PaidPlan,
  subscriptionId: string
): Promise<{ availableCredits: number }> {
  const userRef = adminDb.collection('users').doc(uid);
  const markerRef = adminDb.collection('subscription_payments').doc(`init_${subscriptionId}`);
  const plan = PLANS[planId];

  return adminDb.runTransaction(async (tx) => {
    const [markerSnap, userSnap] = await Promise.all([tx.get(markerRef), tx.get(userRef)]);
    const userData = userSnap.data() || {};

    if (markerSnap.exists) {
      return { availableCredits: Number(userData.availableCredits) || plan.credits };
    }

    const nowMs = Date.now();
    const currentlyActive = hasActiveEntitlement(userData, nowMs);
    const baseCredits = currentlyActive ? Math.max(0, Number(userData.availableCredits) || 0) : 0;
    const newCredits = baseCredits + plan.credits;
    const expiresAt = Timestamp.fromMillis(nowMs + BILLING_CYCLE_DAYS * 86_400_000);

    tx.set(
      userRef,
      {
        isSubscriber: true,
        subscriptionPlan: plan.id,
        subscriptionStatus: 'active',
        subscriptionId,
        subscriptionExpiresAt: expiresAt,
        subscriptionRenewsAt: expiresAt,
        monthlyCredits: plan.credits,
        availableCredits: newCredits,
        lastSubscriptionActivatedAt: Timestamp.now(),
      },
      { merge: true }
    );

    tx.set(markerRef, {
      uid,
      plan: plan.id,
      method: 'card_preapproval',
      subscriptionId,
      processedAt: Timestamp.now(),
    });

    return { availableCredits: newCredits };
  });
}

export interface ServerCardInput {
  cardNumber: string;
  cardholderName: string;
  expirationMonth: string | number;
  expirationYear: string | number;
  securityCode: string;
  cpf: string;
}

/**
 * Gera um card_token_id diretamente na API do Mercado Pago usando o MERCADOPAGO_ACCESS_TOKEN.
 * Garante compatibilidade mesmo quando o frontend não possui a Public Key específica da aplicação de assinaturas.
 */
export async function tokenizeCardOnServer(
  card: ServerCardInput,
  accessToken: string
): Promise<string> {
  const cleanNumber = String(card.cardNumber || '').replace(/\D/g, '');
  const cleanCvv = String(card.securityCode || '').replace(/\D/g, '');
  const cleanCpf = String(card.cpf || '').replace(/\D/g, '');
  const expMonth = Number(String(card.expirationMonth || '').replace(/\D/g, ''));
  let expYear = Number(String(card.expirationYear || '').replace(/\D/g, ''));
  if (expYear > 0 && expYear < 100) {
    expYear += 2000;
  }

  const res = await fetch('https://api.mercadopago.com/v1/card_tokens', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      card_number: cleanNumber,
      expiration_month: expMonth,
      expiration_year: expYear,
      security_code: cleanCvv,
      cardholder: {
        name: String(card.cardholderName || 'TITULAR').trim(),
        identification: {
          type: 'CPF',
          number: cleanCpf,
        },
      },
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.id) {
    const causeMsg = data?.cause?.[0]?.description || data?.message || 'Dados do cartão inválidos.';
    throw new Error(causeMsg);
  }

  return String(data.id);
}
