import { NextRequest, NextResponse } from 'next/server';
import { sendCriticalErrorAlert, shouldIgnoreError } from '@/lib/errorNotifier';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, stack, digest, pathname, userEmail, userId } = body;

    // Filtra erros de rede transitórios, desconexões de crawlers/Googlebot, chunks pós-deploy e restrições de sandbox
    if (shouldIgnoreError(message) || shouldIgnoreError(stack)) {
      return NextResponse.json(
        { status: 'ignored', reason: 'Transient client/crawler network artifact' },
        { status: 200 }
      );
    }

    // Dispara alerta assíncrono para o administrador
    sendCriticalErrorAlert({
      subject: `🚨 [CLIENT-ERROR] Exceção na Interface: ${pathname || 'Página'}`,
      context: `Front-End / Erro em ${pathname || 'Aplicação'}`,
      errorMessage: message || 'Erro não tratado no navegador',
      stack: stack || `Digest: ${digest || 'N/A'}`,
      req,
      requestData: { pathname, digest, userEmail, userId },
      userEmail,
      userId,
      level: 'ALERTA',
    }).catch(err => console.error('[ClientErrorRoute] Erro ao enviar alerta:', err));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
