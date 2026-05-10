import { NextResponse } from 'next/server';

const base = "https://api-m.sandbox.paypal.com";

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
  const data = await response.json();
  return data.access_token;
}

export async function POST(req: Request) {
  try {
    const { orderID } = await req.json();

    const accessToken = await generateAccessToken();
    const url = `${base}/v2/checkout/orders/${orderID}/capture`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await response.json();

    if (data.status === "COMPLETED") {
      return NextResponse.json(data);
    } else {
      throw new Error("O pagamento não foi concluído. Status: " + data.status);
    }
  } catch (error: any) {
    console.error('Erro PayPal Capture:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
