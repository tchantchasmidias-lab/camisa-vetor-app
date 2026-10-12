import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment, PreApproval } from 'mercadopago';
import { v4 as uuidv4 } from 'uuid';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';
import { PLANS, isPaidPlan, type PaidPlan } from '@/lib/subscriptions';
import {
  activateAuthorizedCardSubscription,
  tokenizeCardOnServer,
  type ServerCardInput,
} from '@/lib/subscriptionServer';
import { checkRateLimit } from '@/lib/rateLimit';
import { cleanCPF, cleanPhone, isValidCPF } from '@/lib/validationUtils';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://camisavetor.com.br';

function friendlyCardError(rawMessage: string): string {
  const lower = (rawMessage || '').toLowerCase();
  if (lower.includes('security_code') || lower.includes('cvv')) {
    return 'Código de segurança (CVV) inválido. Verifique os dígitos no verso do cartão.';
  }
  if (lower.includes('expiration') || lower.includes('expired')) {
    return 'Data de validade do cartão inválida ou vencida.';
  }
  if (lower.includes('card_number') || lower.includes('luhn')) {
    return 'Número do cartão inválido. Confira os 16 dígitos digitados.';
  }
  if (lower.includes('identification') || lower.includes('cpf')) {
    return 'CPF do titular inválido. Verifique os dígitos informados.';
  }
  if (lower.includes('insufficient') || lower.includes('rejected') || lower.includes('cc_rejected')) {
    return 'Cartão recusado pelo banco emissor. Tente outro cartão ou pague via Pix (Passe de 30 Dias).';
  }
  return rawMessage || 'Não foi possível autorizar o cartão. Verifique os dados ou use o Pix.';
}

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

    if (!checkRateLimit(`sub-create:${uid}`, 10, 60_000)) {
      return NextResponse.json({ error: 'Muitas tentativas. Aguarde um instante.' }, { status: 429 });
    }

    const body = await req.json().catch(() => ({}));
    const rawPlan = body?.plan || body?.planId;
    if (!isPaidPlan(rawPlan)) {
      return NextResponse.json({ error: 'Plano inválido' }, { status: 400 });
    }
    const requestedPlan = rawPlan as PaidPlan;
    const plan = PLANS[requestedPlan];

    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!accessToken) {
      throw new Error('MERCADOPAGO_ACCESS_TOKEN is not configured');
    }

    const userSnap = await adminDb.collection('users').doc(uid).get();
    const userData = userSnap.data() ?? {};

    const payerEmail = (body?.email || userData.email || tokenEmail || '').trim();
    if (!payerEmail) {
      return NextResponse.json({ error: 'E-mail do usuário não encontrado' }, { status: 400 });
    }

    const paymentMethod: 'card' | 'pix' = body?.paymentMethod === 'pix' ? 'pix' : 'card';

    const client = new MercadoPagoConfig({
      accessToken,
      options: { timeout: 15000 },
    });

    // ══════════════════════════════════════════════════════════════════════════
    // OPÇÃO 1: PIX (PASSE DE 30 DIAS)
    // ══════════════════════════════════════════════════════════════════════════
    if (paymentMethod === 'pix') {
      const sanitizedCpf = cleanCPF(body?.cpf || userData.cpf || '');
      const sanitizedPhone = cleanPhone(body?.phone || userData.phone || '');
      const fullName = String(body?.name || userData.nome || 'Cliente Camisa Vetor').trim();
      const nameParts = fullName.split(/\s+/);
      const firstName = nameParts[0] || 'Cliente';
      const lastName = nameParts.slice(1).join(' ') || 'Assinante';

      if (!sanitizedCpf || !isValidCPF(sanitizedCpf)) {
        return NextResponse.json(
          { error: 'CPF inválido. Informe um CPF válido para gerar o Pix.', code: 'INVALID_CPF' },
          { status: 400 }
        );
      }

      // Salva CPF/Nome no perfil do usuário se ainda não estiver salvo
      if (!userData.cpf || !userData.nome) {
        await adminDb.collection('users').doc(uid).set(
          {
            nome: fullName,
            cpf: sanitizedCpf,
            ...(sanitizedPhone ? { phone: sanitizedPhone } : {}),
          },
          { merge: true }
        );
      }

      const transactionId = uuidv4();
      const expirationDate = new Date();
      expirationDate.setHours(expirationDate.getHours() + 1);

      const phoneArea = sanitizedPhone.length >= 10 ? sanitizedPhone.substring(0, 2) : '';
      const phoneNumber = sanitizedPhone.length >= 10 ? sanitizedPhone.substring(2) : '';

      const payment = new Payment(client);
      const pixResult = await payment.create({
        body: {
          transaction_amount: plan.price,
          description: `${plan.name} (Passe 30 Dias - ${plan.credits} créditos) - Camisa Vetor`,
          payment_method_id: 'pix',
          date_of_expiration: expirationDate.toISOString(),
          payer: {
            email: payerEmail,
            first_name: firstName,
            last_name: lastName,
            identification: {
              type: 'CPF',
              number: sanitizedCpf,
            },
            ...(phoneArea && phoneNumber
              ? { phone: { area_code: phoneArea, number: phoneNumber } }
              : {}),
          },
          metadata: {
            type: 'subscription_pass',
            planId: plan.id,
            userId: uid,
            plan_id: plan.id,
            user_id: uid,
          },
          notification_url: `${SITE_URL}/api/checkout/pix/webhook`,
          external_reference: `subpass|${uid}|${plan.id}|${transactionId}`,
        },
        requestOptions: { idempotencyKey: transactionId },
      });

      const txData = pixResult.point_of_interaction?.transaction_data;
      if (!txData?.qr_code || !txData?.qr_code_base64) {
        throw new Error('Não foi possível obter o QR Code Pix do Mercado Pago.');
      }

      return NextResponse.json({
        success: true,
        mode: 'pix',
        id: pixResult.id,
        transactionId,
        qr_code: txData.qr_code,
        qr_code_base64: txData.qr_code_base64,
        plan: plan.id,
        credits: plan.credits,
      });
    }

    // ══════════════════════════════════════════════════════════════════════════
    // OPÇÃO 2: CARTÃO DE CRÉDITO (ASSINATURA RECORRENTE MENSAL TRANSPARENTE)
    // ══════════════════════════════════════════════════════════════════════════
    let cardTokenId: string | undefined = body?.card_token_id || body?.cardTokenId;
    const cardInput: ServerCardInput | undefined = body?.card;

    if (cardInput?.cpf && !isValidCPF(cleanCPF(cardInput.cpf))) {
      return NextResponse.json(
        { error: 'CPF do titular inválido. Verifique os dígitos informados.', code: 'INVALID_CPF' },
        { status: 400 }
      );
    }

    if (!cardTokenId && cardInput) {
      cardTokenId = await tokenizeCardOnServer(cardInput, accessToken);
    }

    if (!cardTokenId) {
      return NextResponse.json(
        { error: 'Token do cartão não fornecido. Preencha os dados do cartão.' },
        { status: 400 }
      );
    }

    const preApproval = new PreApproval(client);
    let result;

    try {
      result = await preApproval.create({
        body: {
          reason: `${plan.name} - Camisa Vetor`,
          external_reference: `sub|${uid}|${plan.id}`,
          payer_email: payerEmail,
          card_token_id: cardTokenId,
          back_url: `${SITE_URL}/planos?retorno=1`,
          status: 'authorized',
          auto_recurring: {
            frequency: 1,
            frequency_type: 'months',
            transaction_amount: plan.price,
            currency_id: 'BRL',
          },
        },
      });
    } catch (preErr: any) {
      // Se o card_token_id veio de uma Public Key diferente da aplicação atual e temos os dados do cartão,
      // geramos um novo token diretamente na aplicação de assinaturas e tentamos novamente.
      if (cardInput && body?.card_token_id) {
        const freshTokenId = await tokenizeCardOnServer(cardInput, accessToken);
        result = await preApproval.create({
          body: {
            reason: `${plan.name} - Camisa Vetor`,
            external_reference: `sub|${uid}|${plan.id}`,
            payer_email: payerEmail,
            card_token_id: freshTokenId,
            back_url: `${SITE_URL}/planos?retorno=1`,
            status: 'authorized',
            auto_recurring: {
              frequency: 1,
              frequency_type: 'months',
              transaction_amount: plan.price,
              currency_id: 'BRL',
            },
          },
        });
      } else {
        throw preErr;
      }
    }

    if (!result?.id || (result.status !== 'authorized' && result.status !== 'pending')) {
      return NextResponse.json(
        {
          error: 'O pagamento com este cartão não foi autorizado pelo banco emissor. Tente outro cartão ou use o Pix.',
        },
        { status: 400 }
      );
    }

    const { availableCredits } = await activateAuthorizedCardSubscription(
      uid,
      plan.id,
      String(result.id)
    );

    return NextResponse.json({
      success: true,
      mode: 'card',
      status: result.status,
      subscriptionId: result.id,
      plan: plan.id,
      availableCredits,
    });
  } catch (error: any) {
    const causeDesc = error?.cause?.[0]?.description || error?.message || '';
    console.error(
      '[subscriptions/create] erro:',
      error?.message,
      error?.cause ? JSON.stringify(error.cause) : ''
    );
    return NextResponse.json(
      { error: friendlyCardError(causeDesc) },
      { status: 400 }
    );
  }
}
