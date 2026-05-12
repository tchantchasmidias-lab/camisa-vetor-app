import { NextResponse } from 'next/server';

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
    const { items, currency } = await req.json();
    const totalAmount = items.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0);
    const currencyCode = currency || "BRL";

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
      return NextResponse.json({ id: data.id });
    } else {
      throw new Error(data.message || "Erro ao criar pedido no PayPal");
    }
  } catch (error: any) {
    console.error('Erro PayPal Create:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
