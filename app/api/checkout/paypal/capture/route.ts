import { NextResponse } from 'next/server';
import { sendCriticalErrorAlert } from '@/lib/errorNotifier';

async function getPayPalAccessToken(clientId: string, clientSecret: string, apiUrl: string): Promise<string | null> {
  try {
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const response = await fetch(`${apiUrl}/v1/oauth2/token`, {
      method: 'POST',
      body: 'grant_type=client_credentials',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.access_token || null;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  let body: any = null;
  try {
    const clientId = process.env.PAYPAL_CLIENT_ID || process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET || process.env.PAYPAL_SECRET;
    const mode = process.env.PAYPAL_MODE || 'live';

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        {
          error: 'Serviço de pagamento PayPal temporariamente indisponível.',
          code: 'PAYMENT_GATEWAY_UNAVAILABLE',
        },
        { status: 503 }
      );
    }

    const apiUrl = mode === 'live'
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';

    body = await req.json();
    const { orderID } = body || {};

    if (!orderID) {
      return NextResponse.json(
        { error: 'ID do pedido não informado.', code: 'INVALID_ORDER_ID' },
        { status: 400 }
      );
    }

    const accessToken = await getPayPalAccessToken(clientId, clientSecret, apiUrl);
    if (!accessToken) {
      return NextResponse.json(
        {
          error: 'Serviço de pagamento PayPal temporariamente indisponível.',
          code: 'PAYMENT_GATEWAY_UNAVAILABLE',
        },
        { status: 503 }
      );
    }

    const url = `${apiUrl}/v2/checkout/orders/${orderID}/capture`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      cache: 'no-store',
    });

    const data = await response.json();

    if (data.status === 'COMPLETED') {
      return NextResponse.json(data);
    } else {
      return NextResponse.json(
        { error: 'O pagamento não foi concluído.', code: 'PAYMENT_NOT_COMPLETED', status: data.status },
        { status: 400 }
      );
    }
  } catch (error: any) {
    // 🚨 Alerta de falha na captura de pagamento PayPal
    sendCriticalErrorAlert({
      subject: `🚨 [ALERTA] Falha na Captura do Pagamento PayPal - Pedido #${body?.orderID || 'N/A'}`,
      context: 'Checkout / Captura de Pagamento PayPal',
      errorMessage: error?.message || 'Erro ao capturar pagamento no PayPal',
      stack: error?.stack,
      error,
      req,
      requestData: body,
      level: 'CRÍTICO',
    }).catch(err => console.error('[PayPalCapture] Erro ao disparar alerta:', err));

    return NextResponse.json(
      { error: 'Não foi possível confirmar o pagamento no momento.', code: 'PAYPAL_CAPTURE_FAILED' },
      { status: 500 }
    );
  }
}
