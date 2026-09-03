import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
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

    // 1. Diagnóstico Seguro de Presença das Variáveis
    if (!clientId || !clientSecret) {
      console.warn('[PayPal Diagnostic] Variáveis ausentes no processo: ', {
        hasClientId: !!clientId,
        hasClientSecret: !!clientSecret,
        mode: mode,
      });
      return NextResponse.json(
        {
          error: 'O checkout via PayPal está temporariamente indisponível. Por favor, utilize o Pix para liberação instantânea.',
          code: 'PAYMENT_GATEWAY_UNAVAILABLE',
        },
        { status: 503 }
      );
    }

    const apiUrl = mode === 'live'
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';

    body = await req.json();
    const { items, currency, userId, email, couponCode } = body || {};

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Carrinho vazio ou itens inválidos.', code: 'INVALID_CART' },
        { status: 400 }
      );
    }

    const currencyCode = currency || 'BRL';

    // 2. Validação de Preços no Servidor
    let realCartTotal = 0;
    const verifiedItems = [];

    for (const item of items) {
      const docSnap = await adminDb.collection('products').doc(item.id).get();
      if (!docSnap.exists) {
        return NextResponse.json(
          { error: 'Um ou mais produtos selecionados não foram encontrados.', code: 'PRODUCT_NOT_FOUND' },
          { status: 404 }
        );
      }
      const data = docSnap.data()!;
      const realPrice = Number(data.price) || 0;
      realCartTotal += realPrice * (item.quantity || 1);

      verifiedItems.push({
        ...item,
        price: realPrice,
        name: data.name || item.name,
      });
    }

    // 3. Validação de Cupom no Servidor
    let finalTotal = realCartTotal;
    if (couponCode) {
      const couponRef = adminDb.collection('coupons').doc(couponCode.trim().toUpperCase());
      const snap = await couponRef.get();
      if (snap.exists) {
        const coupon = snap.data()!;
        if (coupon.active) {
          let isValid = true;
          if (coupon.expiresAt) {
            const expiresAt = coupon.expiresAt.toDate ? coupon.expiresAt.toDate() : new Date(coupon.expiresAt);
            if (new Date() > expiresAt) isValid = false;
          }
          if (coupon.minOrder && realCartTotal < coupon.minOrder) isValid = false;

          if (isValid) {
            let discount = 0;
            if (coupon.type === 'percent') {
              discount = (realCartTotal * coupon.value) / 100;
            } else if (coupon.type === 'fixed') {
              discount = coupon.value;
            }
            discount = Math.min(discount, realCartTotal);
            finalTotal = Math.max(0, realCartTotal - discount);
          }
        }
      }
    }

    const totalAmount = parseFloat(finalTotal.toFixed(2));

    // 4. Obtenção do access_token
    const accessToken = await getPayPalAccessToken(clientId, clientSecret, apiUrl);
    if (!accessToken) {
      console.warn(
        '[PayPal Diagnostic] Falha ao autenticar na API do PayPal (Basic Auth rejeitado). Verifique se as chaves são compatíveis com o modo:',
        mode
      );
      return NextResponse.json(
        {
          error: 'O checkout via PayPal está temporariamente indisponível. Por favor, utilize o Pix para liberação instantânea.',
          code: 'PAYMENT_GATEWAY_UNAVAILABLE',
        },
        { status: 503 }
      );
    }

    // 5. Criação do pedido no PayPal
    const url = `${apiUrl}/v2/checkout/orders`;
    const payload = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: currencyCode,
            value: totalAmount.toFixed(2),
          },
        },
      ],
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    const data = await response.json();

    if (data.id) {
      // Salvar pedido inicial como "pendente"
      if (userId) {
        await adminDb.collection('pedidos').doc(data.id).set({
          userId,
          email: email || '',
          items: verifiedItems,
          total: totalAmount,
          transactionId: data.id,
          paymentMethod: 'paypal',
          createdAt: new Date().toISOString(),
          status: 'pendente',
          verified: false,
        });
      }

      return NextResponse.json({ id: data.id });
    } else {
      return NextResponse.json(
        {
          error: 'Não foi possível gerar a transação com PayPal. Por favor, tente com Pix.',
          code: 'PAYPAL_ORDER_FAILED',
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    // 🚨 Alerta de observabilidade
    sendCriticalErrorAlert({
      subject: `🚨 [ALERTA] Falha na Criação de Pedido PayPal - Cliente: ${body?.email || 'Desconhecido'}`,
      context: 'Checkout / Criação de Pedido PayPal',
      errorMessage: error?.message || 'Erro ao criar pedido no PayPal',
      stack: error?.stack,
      error,
      req,
      requestData: body,
      userEmail: body?.email,
      userId: body?.userId,
      level: 'CRÍTICO',
    }).catch(err => console.error('[PayPalCreate] Erro ao disparar alerta:', err));

    return NextResponse.json(
      {
        error: 'Não foi possível processar o pagamento no momento. Por favor, utilize o Pix para liberação instantânea.',
        code: 'PAYPAL_ORDER_FAILED',
      },
      { status: 500 }
    );
  }
}
