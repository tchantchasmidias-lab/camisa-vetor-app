import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

const base = "https://api-m.paypal.com";

async function generateAccessToken() {
  const { NEXT_PUBLIC_PAYPAL_CLIENT_ID, PAYPAL_SECRET } = process.env;
  if (!NEXT_PUBLIC_PAYPAL_CLIENT_ID || !PAYPAL_SECRET) {
    throw new Error("MISSING_API_CREDENTIALS");
  }
  const auth = Buffer.from(`${NEXT_PUBLIC_PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString("base64");
  const response = await fetch(`${base}/v1/oauth2/token`, {
    method: "POST",
    body: "grant_type=client_credentials",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });
  
  if (!response.ok) {
    throw new Error("Falha ao gerar access token do PayPal");
  }
  
  const data = await response.json();
  return data.access_token;
}

export async function POST(req: Request) {
  try {
    const { items, currency, userId, email, couponCode } = await req.json();
    const currencyCode = currency || "BRL";

    // Validação de Preços no Servidor
    let realCartTotal = 0;
    const verifiedItems = [];

    for (const item of items) {
      const docSnap = await adminDb.collection('products').doc(item.id).get();
      if (!docSnap.exists) {
        throw new Error(`Produto não encontrado: ${item.id}`);
      }
      const data = docSnap.data()!;
      const realPrice = Number(data.price) || 0;
      realCartTotal += realPrice * (item.quantity || 1);
      
      verifiedItems.push({
        ...item,
        price: realPrice,
        name: data.name || item.name
      });
    }

    // Validação de Cupom no Servidor
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

    const accessToken = await generateAccessToken();
    const url = `${base}/v2/checkout/orders`;
    const payload = {
      intent: "CAPTURE",
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
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
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
          verified: false
        });
      }

      return NextResponse.json({ id: data.id });
    } else {
      throw new Error(data.message || "Erro ao criar pedido no PayPal");
    }
  } catch (error: any) {
    console.error('Erro PayPal Create:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
