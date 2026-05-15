import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(req: Request) {
  const resend = new Resend(process.env.RESEND_API_KEY || 're_stub');
  
  try {
    const { email, subject, body, type } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'E-mail de destino é obrigatório' }, { status: 400 });
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: 'RESEND_API_KEY não configurada' }, { status: 500 });
    }

    // Variáveis de exemplo para o teste
    const testVars: any = {
      nome: 'Cliente de Teste',
      codigo_pix: '00020101021226830014br.gov.bcb.pix0136123e4567-e89b-12d3-a456-42661417400052040000530398654041.005802BR5913Camisa Vetor6008BRASILIA62070503***6304E2CA',
      links: `
        <div style="margin-bottom: 15px; padding: 20px; background-color: #222; border: 1px solid #333; border-radius: 12px;">
          <strong style="color: #fff; display: block; margin-bottom: 10px; font-size: 16px;">Vetor de Teste Exemplo.eps</strong>
          <a href="#" style="background-color: #fe7302; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Fazer Download Seguro</a>
        </div>
      `
    };

    // Substituir variáveis
    let finalSubject = (subject || 'E-mail de Teste').replace(/{{nome}}/g, testVars.nome);
    let finalBody = (body || 'Este é um e-mail de teste.').replace(/{{nome}}/g, testVars.nome);
    
    if (type === 'pix') {
      finalSubject = finalSubject.replace(/{{codigo_pix}}/g, 'PIX_TESTE_123');
      finalBody = finalBody.replace(/{{codigo_pix}}/g, testVars.codigo_pix);
    }
    
    if (type === 'delivery') {
      finalBody = finalBody.replace(/{{links}}/g, testVars.links);
    }

    const htmlContent = finalBody.replace(/\n/g, '<br>');

    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background-color: #111; color: #fff; padding: 40px; border-radius: 16px; border: 1px solid #222;">
        <div style="text-align: center; margin-bottom: 30px;">
          <a href="https://camisavetor.com" style="text-decoration: none;">
            <img src="https://camisavetor.com/logo.svg" alt="Camisa Vetor" width="180" style="display: block; margin: 0 auto; border: none;" />
            <div style="color: #fe7302; font-size: 20px; font-weight: 900; margin-top: 10px; font-family: sans-serif;">
              <span style="color: #ffffff;">CAMISA</span> VETOR
            </div>
          </a>
          <div style="font-size: 10px; color: #444; margin-top: 5px; letter-spacing: 1px;">MODO DE TESTE</div>
        </div>
        
        <div style="font-size: 16px; line-height: 1.6; color: #ccc;">
          ${htmlContent}
        </div>
        
        <div style="margin-top: 40px; text-align: center;">
          <a href="https://camisavetor.com" style="background-color: #fe7302; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Acessar o Site</a>
        </div>
        
        <hr style="border: 0; border-top: 1px solid #222; margin: 30px 0;" />
        <p style="font-size: 12px; color: #555; text-align: center;">
          Este é um e-mail de teste enviado do seu Painel Admin.<br/>
          &copy; ${new Date().getFullYear()} Camisa Vetor
        </p>
      </div>
    `;

    await resend.emails.send({
      from: 'Camisa Vetor <contato@camisavetor.com>',
      to: [email],
      subject: `[TESTE] ${finalSubject}`,
      html: emailHtml,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erro ao enviar e-mail de teste:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
