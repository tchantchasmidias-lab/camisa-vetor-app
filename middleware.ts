import { NextRequest, NextResponse } from 'next/server';

const PRIMARY_HOST = 'camisavetor.com.br';
const CANONICAL_ORIGIN = `https://${PRIMARY_HOST}`;

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const host = (request.headers.get('host') || '').toLowerCase().split(':')[0];
  const proto = request.headers.get('x-forwarded-proto') || 'https';

  // ── 1. REDIRECIONAMENTOS CANÔNICOS DE SEO (301 PERMANENT) ───────────────────
  // Apenas em produção ou quando um host externo for utilizado
  const isProduction = process.env.NODE_ENV === 'production';
  const isWwwOrAlternativeDomain =
    host === 'www.camisavetor.com.br' ||
    host === 'camisavetor.com' ||
    host === 'www.camisavetor.com';

  const isHttp = isProduction && proto === 'http';
  const hasTrailingSlash = pathname !== '/' && pathname.endsWith('/');

  if (isWwwOrAlternativeDomain || isHttp || hasTrailingSlash) {
    const cleanPathname = hasTrailingSlash ? pathname.replace(/\/+$/, '') : pathname;
    const targetUrl = `${CANONICAL_ORIGIN}${cleanPathname}${search}`;
    return NextResponse.redirect(targetUrl, 301);
  }

  // ── 2. PROTEÇÃO DO STUDIO (/studio/*) ───────────────────────────────────────
  if (pathname.startsWith('/studio')) {
    // Bypass em ambiente local de desenvolvimento
    if (!isProduction) {
      return NextResponse.next();
    }

    // Permite rota de login do Studio
    if (pathname === '/studio/login' || pathname.startsWith('/studio/login/')) {
      return NextResponse.next();
    }

    // Verifica cookie de sessão
    const session = request.cookies.get('__session')?.value;
    if (!session) {
      const loginUrl = new URL('/studio/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  // Executa o middleware nas rotas de páginas, ignorando arquivos estáticos e assets
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icon.*|apple-touch-icon.*|manifest.json|robots.txt|sitemap.xml|api/).*)',
  ],
};
