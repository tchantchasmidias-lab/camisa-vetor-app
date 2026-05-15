import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { Resend } from 'resend';
import { MercadoPagoConfig, Payment } from 'mercadopago';

export async function POST(req: Request) {
  try {
    const { userId, email, items, transactionId, paymentMethod } = await req.json();

    if (!userId || !email || !items || !transactionId) {
      return NextResponse.json({ error: 'Faltam parâmetros obrigatórios' }, { status: 400 });
    }

    // 🛡️ PROTEÇÃO 1: Verificar se essa transação já foi processada para evitar "re-uso"
    const txCheck = await adminDb.collection('pedidos').doc(transactionId).get();
    if (txCheck.exists && txCheck.data()?.status === 'pago') {
       return NextResponse.json({ error: 'Esta transação já foi processada' }, { status: 400 });
    }

    // 🛡️ PROTEÇÃO 2: Verificar status REAL no provedor de pagamento
    let isVerified = false;

    if (paymentMethod === 'pix') {
      if (!process.env.MERCADOPAGO_ACCESS_TOKEN) throw new Error("MP Token não configurado");
      const client = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN });
      const payment = new Payment(client);
      const result = await payment.get({ id: transactionId });
      
      if (result.status === 'approved') {
        isVerified = true;
      }
    } else if (paymentMethod === 'paypal') {
      // 🛡️ PROTEÇÃO 2 (PayPal): Re-verificar status diretamente no PayPal Live
      try {
        const { NEXT_PUBLIC_PAYPAL_CLIENT_ID, PAYPAL_SECRET } = process.env;
        const auth = Buffer.from(`${NEXT_PUBLIC_PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString("base64");
        
        // 1. Pegar Access Token
        const tokenRes = await fetch("https://api-m.paypal.com/v1/oauth2/token", {
          method: "POST",
          body: "grant_type=client_credentials",
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
        });
        const { access_token } = await tokenRes.json();

        // 2. Verificar Pedido
        const orderRes = await fetch(`https://api-m.paypal.com/v2/checkout/orders/${transactionId}`, {
          headers: { Authorization: `Bearer ${access_token}` }
        });
        const orderData = await orderRes.json();
        
        if (orderData.status === 'COMPLETED' || orderData.status === 'APPROVED') {
          isVerified = true;
        }
      } catch (err) {
        console.error("Erro ao verificar PayPal no servidor:", err);
      }
    }

    if (!isVerified) {
      return NextResponse.json({ error: 'Pagamento não confirmado no provedor' }, { status: 403 });
    }

    // 1. Salvar pedido no Firestore (Marcado como verificado)
    const orderData = {
      userId,
      email,
      items, 
      transactionId,
      paymentMethod,
      createdAt: new Date().toISOString(),
      status: 'pago',
      verified: true
    };

    await adminDb.collection('pedidos').doc(transactionId).set(orderData);

    // 2. Buscar links diretos
    const productsLinks = await Promise.all(items.map(async (item: any) => {
      let directLink = '#';
      try {
        const productSnap = await adminDb.collection('products').doc(item.id).get();
        if (productSnap.exists) {
          const data = productSnap.data();
          directLink = data?.urls?.download || data?.urls?.destaque || '#';
        }
      } catch (e) {
        console.error("Erro ao buscar link", e);
      }
      return { ...item, directLink };
    }));

    // 3. Enviar E-mail via Resend
    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const linksHtml = productsLinks.map((item: any) => `
        <div style="margin-bottom: 15px; padding: 20px; background-color: #222; border: 1px solid #333; border-radius: 12px;">
          <strong style="color: #fff; display: block; margin-bottom: 10px; font-size: 16px;">${item.name}</strong>
          <a href="${item.directLink}" style="background-color: #fe7302; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Fazer Download Seguro</a>
        </div>
      `).join('');

      // Buscar template dinâmico
      const configDoc = await adminDb.collection('configuracoes').doc('email_templates').get();
      let subject = '🚀 Seus vetores chegaram!';
      let body = 'Olá {{nome}}, muito obrigado pela compra. Seguem abaixo os links para baixar seus arquivos.\n\n{{links}}';
      
      if (configDoc.exists) {
        const data = configDoc.data();
        if (data?.deliverySubject) subject = data.deliverySubject;
        if (data?.deliveryBody) body = data.deliveryBody;
      }

      // Substituir variáveis
      const customerName = metadata?.firstName || 'Cliente';
      const finalSubject = subject.replace(/{{nome}}/g, customerName);
      
      // Converte quebras de linha mas preserva a tag {{links}} para substituir pelo HTML
      let htmlBody = body.replace(/{{nome}}/g, customerName).replace(/\n/g, '<br>');
      htmlBody = htmlBody.replace(/{{links}}/g, linksHtml);

      await resend.emails.send({
        from: 'Camisa Vetor <contato@camisavetor.com>',
        to: email,
        subject: finalSubject,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background-color: #111; color: #fff; padding: 40px; border-radius: 16px;">
            <h1 style="color: #fe7302; margin-top: 0;">Pagamento Aprovado!</h1>
            <div style="font-size: 16px; line-height: 1.6; color: #ccc;">
              ${htmlBody}
            </div>
            <hr style="border: 0; border-top: 1px solid #333; margin: 30px 0;" />
            <p style="font-size: 12px; color: #666; text-align: center;">Obrigado por comprar na Camisa Vetor! Este é um e-mail automático.</p>
          </div>
        `
      });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Erro no fulfillment:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
