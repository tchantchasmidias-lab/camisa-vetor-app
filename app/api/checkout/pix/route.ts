import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { items, email, firstName, cpf } = body;
    
    if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
      throw new Error("MERCADOPAGO_ACCESS_TOKEN is not configured");
    }

    const client = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN, options: { timeout: 5000 } });
    const payment = new Payment(client);

    const totalAmount = items.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0);
    const transactionId = uuidv4();

    const request = {
      body: {
        transaction_amount: totalAmount,
        description: `Compra Camisa Vetor - ${items.length} itens`,
        payment_method_id: 'pix',
        payer: {
          email,
          first_name: firstName,
          identification: {
            type: 'CPF',
            number: cpf ? cpf.replace(/\D/g, '') : '00000000000'
          }
        },
        external_reference: transactionId,
      },
      requestOptions: { idempotencyKey: transactionId }
    };

    const result = await payment.create(request);

    if (!result.point_of_interaction?.transaction_data) {
      throw new Error("Não foi possível obter os dados do Pix");
    }

    const { qr_code, qr_code_base64 } = result.point_of_interaction.transaction_data;

    return NextResponse.json({
      id: result.id, // Mercado Pago Payment ID
      transactionId,
      qr_code,
      qr_code_base64
    });

  } catch (error: any) {
    console.error('Erro ao gerar Pix:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
