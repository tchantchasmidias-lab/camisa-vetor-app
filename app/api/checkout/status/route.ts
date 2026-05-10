import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID do pagamento não fornecido' }, { status: 400 });
    }

    if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
      throw new Error("MERCADOPAGO_ACCESS_TOKEN is not configured");
    }

    const client = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN });
    const payment = new Payment(client);

    const result = await payment.get({ id: id });

    return NextResponse.json({
      id: result.id,
      status: result.status, // e.g. 'pending', 'approved', 'rejected'
      status_detail: result.status_detail
    });

  } catch (error: any) {
    console.error('Erro ao buscar status do Pix:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
