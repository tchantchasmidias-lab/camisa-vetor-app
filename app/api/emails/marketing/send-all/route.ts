import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { adminDb } from '@/lib/firebaseAdmin';

// Função utilitária para delay (evitar rate limit do Resend)
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function POST(req: Request) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY || 're_stub');
    
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: 'RESEND_API_KEY não configurada' }, { status: 500 });
    }

    // 1. Buscar Template de Marketing
    const configDoc = await adminDb.collection('configuracoes').doc('email_templates').get();
    if (!configDoc.exists) {
      return NextResponse.json({ error: 'Template de marketing não encontrado' }, { status: 404 });
    }
    
    const data = configDoc.data();
    const subject = data?.marketingSubject || '🔥 Novidade na Camisa Vetor!';
    const body = data?.marketingBody || '';

    if (!body) {
      return NextResponse.json({ error: 'O corpo do e-mail de marketing está vazio' }, { status: 400 });
    }

    // 2. Buscar todos os usuários
    const usersSnapshot = await adminDb.collection('users').get();
    if (usersSnapshot.empty) {
      return NextResponse.json({ success: true, sentCount: 0, message: 'Nenhum usuário cadastrado' });
    }

    const users = usersSnapshot.docs.map(doc => ({
      email: doc.data().email,
      nome: doc.data().nome || 'Cliente'
    })).filter(u => u.email); // Garantir que tem e-mail

    let sentCount = 0;

    // 3. Loop de envio com delay
    for (const user of users) {
      try {
        const finalSubject = subject.replace(/{{nome}}/g, user.nome);
        const finalBody = body.replace(/{{nome}}/g, user.nome);
        const htmlBody = finalBody.replace(/\n/g, '<br>');

        const emailHtml = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background-color: #111; color: #fff; padding: 40px; border-radius: 16px;">
            <h1 style="color: #fe7302; margin-top: 0;">Oferta Especial!</h1>
            <div style="font-size: 16px; line-height: 1.6; color: #ccc;">
              ${htmlBody}
            </div>
            <div style="margin-top: 40px; text-align: center;">
              <a href="https://camisavetor.com" style="background-color: #fe7302; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Aproveitar Agora</a>
            </div>
            <hr style="border: 0; border-top: 1px solid #333; margin: 30px 0;" />
            <p style="font-size: 10px; color: #555; text-align: center;">
              Você recebeu este e-mail porque é cadastrado na Camisa Vetor.
            </p>
          </div>
        `;

        await resend.emails.send({
          from: 'Camisa Vetor <contato@camisavetor.com>',
          to: [user.email],
          subject: finalSubject,
          html: emailHtml,
        });

        sentCount++;
        
        // Pequena pausa para respeitar o limite de 2 e-mails por segundo do Resend Free
        await sleep(600); 

      } catch (e) {
        console.error(`Falha ao enviar para ${user.email}:`, e);
      }
    }

    return NextResponse.json({ success: true, sentCount });

  } catch (error: any) {
    console.error('Erro crítico no disparo de marketing:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
