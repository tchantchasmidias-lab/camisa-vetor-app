import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { v4 as uuidv4 } from 'uuid';
import { Resend } from 'resend';
import { adminDb } from '@/lib/firebaseAdmin';


export async function POST(req: Request) {
  const resend = new Resend(process.env.RESEND_API_KEY || 're_stub');
  try {
    const body = await req.json();
    const { items, email, firstName, cpf, userId, couponCode } = body;
    
    if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
      throw new Error("MERCADOPAGO_ACCESS_TOKEN is not configured");
    }

    const client = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN, options: { timeout: 5000 } });
    const payment = new Payment(client);

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
    const transactionId = uuidv4();

    const expirationDate = new Date();
    expirationDate.setHours(expirationDate.getHours() + 1);

    const request = {
      body: {
        transaction_amount: totalAmount,
        description: `Compra Camisa Vetor - ${items.length} itens`,
        payment_method_id: 'pix',
        date_of_expiration: expirationDate.toISOString(),
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

    // Salvar pedido inicial como "pendente"
    if (userId) {
      await adminDb.collection('pedidos').doc(transactionId).set({
        userId,
        email,
        items: verifiedItems,
        total: totalAmount,
        transactionId,
        paymentMethod: 'pix',
        createdAt: new Date().toISOString(),
        status: 'pendente',
        verified: false
      });
    }

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
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background-color: #111; color: #fff; padding: 40px; border-radius: 16px; border: 1px solid #222;">
            <div style="text-align: center; margin-bottom: 30px;">
              <a href="https://camisavetor.com" style="text-decoration: none;">
                <img src="https://camisavetor.com/logo-email.png" alt="Camisa Vetor" width="180" style="display: block; margin: 0 auto; border: none;" />
              </a>
            </div>

            <div style="font-size: 16px; line-height: 1.6; color: #ccc;">
              ${htmlBody}
            </div>
            <div style="margin-top: 40px; background-color: #222; padding: 20px; border-radius: 8px; border: 1px dashed #fe7302; text-align: center;">
              <p style="margin-top: 0; font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 2px;">Código Pix Copia e Cola:</p>
              <p style="word-break: break-all; font-family: monospace; color: #fff; font-size: 14px;">${qr_code}</p>
            </div>
            <hr style="border: 0; border-top: 1px solid #222; margin: 30px 0;" />
            <p style="font-size: 12px; color: #555; text-align: center;">
              &copy; ${new Date().getFullYear()} Camisa Vetor
            </p>
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
    if (error?.cause) {
      console.error('Mercado Pago error cause:', JSON.stringify(error.cause, null, 2));
    }
    const errorMessage = error?.cause?.[0]?.description || error?.message || 'Erro ao processar pagamento via Pix';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

