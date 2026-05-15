import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { adminDb } from '@/lib/firebaseAdmin';


export async function POST(req: Request) {
  const resend = new Resend(process.env.RESEND_API_KEY || 're_stub');
  try {
    const { email, nome } = await req.json();

    if (!email || !nome) {
      return NextResponse.json({ error: 'E-mail e nome são obrigatórios' }, { status: 400 });
    }

    if (!process.env.RESEND_API_KEY) {
      console.warn("RESEND_API_KEY não configurada. Simulando envio de boas-vindas para:", email);
      return NextResponse.json({ success: true, simulated: true });
    }

    // Buscar template
    const configDoc = await adminDb.collection('configuracoes').doc('email_templates').get();
    let subject = '🎉 Bem-vindo à Camisa Vetor!';
    let body = 'Olá {{nome}}! Seja muito bem-vindo à nossa plataforma. Aqui você encontra os melhores vetores para estamparia.';
    
    if (configDoc.exists) {
      const data = configDoc.data();
      if (data?.welcomeSubject) subject = data.welcomeSubject;
      if (data?.welcomeBody) body = data.welcomeBody;
    }

    // Substituir variáveis
    const finalSubject = subject.replace(/{{nome}}/g, nome);
    const finalBody = body.replace(/{{nome}}/g, nome);

    // Converter quebras de linha para <br>
    const htmlBody = finalBody.replace(/\n/g, '<br>');

    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background-color: #111; color: #fff; padding: 40px; border-radius: 16px;">
        <h1 style="color: #fe7302; margin-top: 0;">Bem-vindo!</h1>
        <div style="font-size: 16px; line-height: 1.6; color: #ccc;">
          ${htmlBody}
        </div>
        <div style="margin-top: 40px; text-align: center;">
          <a href="https://camisavetor.com" style="background-color: #fe7302; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Acessar a Loja</a>
        </div>
      </div>
    `;

    await resend.emails.send({
      from: 'Camisa Vetor <contato@camisavetor.com>',
      to: [email],
      subject: finalSubject,
      html: emailHtml,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erro ao enviar e-mail de boas-vindas:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
