import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { Resend } from 'resend';

export async function POST(req: Request) {
  try {
    const { userId, email, items, transactionId, paymentMethod } = await req.json();

    if (!userId || !email || !items) {
      return NextResponse.json({ error: 'Faltam parâmetros obrigatórios' }, { status: 400 });
    }

    // 1. Save order to Firestore
    const orderData = {
      userId,
      items, 
      transactionId,
      paymentMethod,
      createdAt: new Date().toISOString(),
      status: 'pago'
    };

    const purchaseRef = adminDb.collection('pedidos').doc(transactionId);
    await purchaseRef.set(orderData);

    // 2. Fetch direct links from products collection if possible
    const productsLinks = await Promise.all(items.map(async (item: any) => {
      let directLink = '#';
      try {
        const productSnap = await adminDb.collection('products').doc(item.id).get();
        if (productSnap.exists) {
          const data = productSnap.data();
          directLink = data?.urls?.download || data?.downloadUrl || data?.fileUrl || `http://localhost:3001/downloads`;
        }
      } catch (e) {
        console.error("Erro ao buscar link do produto", e);
      }
      return { ...item, directLink };
    }));

    // 3. Send Email
    let linksHtml = productsLinks.map((item: any) => `
      <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #eee; border-radius: 8px;">
        <h3 style="margin-top: 0;">${item.name}</h3>
        <a href="${item.directLink}" style="display: inline-block; padding: 10px 20px; background-color: #fe7302; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Baixar Arquivo</a>
      </div>
    `).join('');

    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: 'Camisa Vetor <onboarding@resend.dev>', // Usar domínio verificado em produção
        to: email,
        subject: 'Pagamento Aprovado - Seus Vetores',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #fe7302;">Pagamento Confirmado!</h1>
            <p>Olá! Seu pagamento via ${paymentMethod.toUpperCase()} foi aprovado.</p>
            <p>Seus arquivos já estão liberados para download:</p>
            ${linksHtml}
            <p style="margin-top: 30px; font-size: 12px; color: #666;">
              Você também pode acessar e baixar seus arquivos a qualquer momento na sua <a href="https://camisa-vetor.com/perfil">Página de Perfil</a> no nosso site.
            </p>
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
