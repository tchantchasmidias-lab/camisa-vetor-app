import { NextResponse } from 'next/server';
import { MercadoPagoConfig, PreApproval } from 'mercadopago';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';
import { PLANS, isPaidPlan, hasActiveEntitlement, type PaidPlan } from '@/lib/subscriptions';
import { checkRateLimit } from '@/lib/rateLimit';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://camisavetor.com.br';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Autenticação necessária' }, { status: 401 });
    }

    let uid: string;
    let tokenEmail: string | undefined;
    try {
      const decoded = await adminAuth.verifyIdToken(authHeader.split('Bearer ')[1]);
      uid = decoded.uid;
      tokenEmail = decoded.email;
    } catch {
      return NextResponse.json({ error: 'Sessão inválida ou expirada' }, { status: 401 });
    }

    if (!checkRateLimit(`sub-create:${uid}`, 5, 60_000)) {
      return NextResponse.json({ error: 'Muitas tentativas. Aguarde um instante.' }, { status: 429 });
    }

    const body = await req.json().catch(() => ({}));
    if (!isPaidPlan(body?.plan)) {
      return NextResponse.json({ error: 'Plano inválido' }, { status: 400 });
    }
    const requestedPlan = body.plan as PaidPlan;
    const plan = PLANS[requestedPlan];

    if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
      throw new Error('MERCADOPAGO_ACCESS_TOKEN is not configured');
    }

    const userSnap = await adminDb.collection('users').doc(uid).get();
    const userData = userSnap.data() ?? {};

    // Evita assinaturas duplicadas para o mesmo usuário
    if (hasActiveEntitlement(userData) && userData.subscriptionStatus === 'active') {
      return NextResponse.json(
        { error: 'Você já possui uma assinatura ativa.' },
        { status: 409 }
      );
    }

    const payerEmail = (userData.email || tokenEmail || '').trim();
    if (!payerEmail) {
      return NextResponse.json({ error: 'E-mail do usuário não encontrado' }, { status: 400 });
    }

    const client = new MercadoPagoConfig({
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
      options: { timeout: 10000 },
    });

    // external_reference carrega usuário e plano: o webhook é stateless e confia
    // apenas nos dados retornados pela API do Mercado Pago.
    const result = await new PreApproval(client).create({
      body: {
        reason: `${plan.name} - Camisa Vetor`,
        external_reference: `sub|${uid}|${plan.id}`,
        payer_email: payerEmail,
        back_url: `${SITE_URL}/planos?retorno=1`,
        status: 'pending',
        auto_recurring: {
          frequency: 1,
          frequency_type: 'months',
          transaction_amount: plan.price,
          currency_id: 'BRL',
        },
      },
    });

    if (!result.init_point) {
      throw new Error('Mercado Pago não retornou o link de checkout');
    }

    return NextResponse.json({ success: true, initPoint: result.init_point, subscriptionId: result.id });
  } catch (error: any) {
    console.error('[subscriptions/create] erro:', error?.message, error?.cause ? JSON.stringify(error.cause) : '');
    return NextResponse.json(
      { error: 'Não foi possível iniciar a assinatura. Tente novamente em instantes.' },
      { status: 500 }
    );
  }
}
