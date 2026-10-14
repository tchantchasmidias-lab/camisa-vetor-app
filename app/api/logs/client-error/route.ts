import { NextRequest, NextResponse } from 'next/server';
import { sendCriticalErrorAlert } from '@/lib/errorNotifier';
import { shouldIgnoreError, isBotUserAgent } from '@/lib/errorUtils';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, stack, digest, pathname, userEmail, userId, userAgent: bodyUA } = body || {};

    const userAgent = req.headers.get('user-agent') || bodyUA || '';

    // 1. Filtra erros de rede transitórios, conexões fechadas, chunks e extensões
    if (shouldIgnoreError(message, userAgent) || shouldIgnoreError(stack, userAgent)) {
      return NextResponse.json(
        { status: 'ignored', reason: 'Transient network error, connection closed, translation or browser extension' },
        { status: 200 }
      );
    }

    // 2. Se for bot/crawler conhecido (Googlebot, bingbot, Lighthouse, etc.)
    if (isBotUserAgent(userAgent)) {
      console.log(`[ClientErrorRoute] Erro ignorado de crawler/bot (${userAgent}) em ${pathname}: ${message}`);
      return NextResponse.json(
        { status: 'ignored', reason: 'Bot/crawler automated crawl activity' },
        { status: 200 }
      );
    }

    // 3. Checagem extra de segurança para extensões de terceiros e manipulação de nós do DOM
    const fullText = `${message || ''} ${stack || ''}`.toLowerCase();
    if (
      fullText.includes('chrome-extension://') ||
      fullText.includes('moz-extension://') ||
      fullText.includes('safari-extension://') ||
      fullText.includes('insertbefore') ||
      fullText.includes('removechild') ||
      fullText.includes('not a child of this node')
    ) {
      return NextResponse.json(
        { status: 'ignored', reason: 'Third-party extension or DOM manipulation' },
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
      requestData: { pathname, digest, userEmail, userId, userAgent },
      userEmail,
      userId,
      level: 'ALERTA',
    }).catch(err => console.error('[ClientErrorRoute] Erro ao enviar alerta:', err));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
