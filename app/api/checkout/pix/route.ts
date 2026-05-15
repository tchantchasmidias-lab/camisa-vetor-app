import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { v4 as uuidv4 } from 'uuid';
import { Resend } from 'resend';
import { adminDb } from '@/lib/firebaseAdmin';

const resend = new Resend(process.env.RESEND_API_KEY);

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

    // Disparar E-mail de Aguardando Pagamento (Pix)
    if (process.env.RESEND_API_KEY) {
      try {
        const configDoc = await adminDb.collection('configuracoes').doc('email_templates').get();
        let subject = '⏳ Seu pedido está quase lá!';
        let body = 'Identificamos o seu pedido. Faça o pagamento para liberar seus arquivos imediatamente.';
        
        if (configDoc.exists) {
          const data = configDoc.data();
          if (data?.pixSubject) subject = data.pixSubject;
          if (data?.pixBody) body = data.pixBody;
        }

        const finalSubject = subject.replace(/{{nome}}/g, String(firstName || '')).replace(/{{codigo_pix}}/g, String(qr_code || ''));
        const finalBody = body.replace(/{{nome}}/g, String(firstName || '')).replace(/{{codigo_pix}}/g, String(qr_code || ''));
        const htmlBody = finalBody.replace(/\n/g, '<br>');

        const emailHtml = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background-color: #111; color: #fff; padding: 40px; border-radius: 16px;">
            <h1 style="color: #fe7302; margin-top: 0;">Aguardando Pagamento</h1>
            <div style="font-size: 16px; line-height: 1.6; color: #ccc;">
              ${htmlBody}
            </div>
            <div style="margin-top: 40px; background-color: #222; padding: 20px; border-radius: 8px; border: 1px dashed #fe7302; text-align: center;">
              <p style="margin-top: 0; font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 2px;">Código Pix Copia e Cola:</p>
              <p style="word-break: break-all; font-family: monospace; color: #fff; font-size: 14px;">${qr_code}</p>
            </div>
          </div>
        `;

        // Executar de forma assíncrona para não travar a resposta do checkout
        resend.emails.send({
          from: 'Camisa Vetor <contato@camisavetor.com>',
          to: [email],
          subject: finalSubject,
          html: emailHtml,
        }).catch(console.error);

      } catch (e) {
        console.error("Erro ao tentar enviar e-mail do Pix:", e);
      }
    }

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
