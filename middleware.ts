import { NextRequest, NextResponse } from 'next/server';

/**
 * Middleware de proteção do Studio.
 * Intercepta todas as rotas /studio/* e verifica o cookie de sessão Firebase.
 * Se não houver sessão, redireciona para /studio/login.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Bypass de desenvolvimento ──────────────────────────────────────────────
  // Em ambiente local (npm run dev) a autenticação é ignorada.
  // Em produção, process.env.NODE_ENV === 'production', então esse bloco é pulado.
  if (process.env.NODE_ENV === 'development') {
    return NextResponse.next();
  }

  // Permite acesso público apenas à rota de login do studio
  if (pathname === '/studio/login' || pathname.startsWith('/studio/login/')) {
    return NextResponse.next();
  }

  // Verifica o cookie de sessão Firebase (__session é o padrão do Firebase Admin SDK)
  const session = request.cookies.get('__session')?.value;
  if (!session) {
    const loginUrl = new URL('/studio/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Aplica SOMENTE às rotas do studio — nenhuma rota do e-commerce é afetada
  matcher: ['/studio/:path*'],
};
