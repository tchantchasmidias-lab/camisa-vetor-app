import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// ── Inicializa Firebase Admin (singleton) ─────────────────────────────────────
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId:   process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey:  process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const SESSION_COOKIE_DURATION = 60 * 60 * 24 * 7 * 1000; // 7 dias em ms

/**
 * POST /studio/api/session
 *
 * Recebe um ID token do Firebase Auth (client-side),
 * verifica se o usuário é admin no Firestore,
 * e cria um cookie de sessão de longa duração.
 */
export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json() as { idToken: string };

    if (!idToken) {
      return NextResponse.json({ error: 'ID token ausente.' }, { status: 400 });
    }

    // 1. Verifica o token com o Firebase Admin
    const decodedToken = await getAuth().verifyIdToken(idToken);

    // 2. Verifica se o usuário tem role de admin no Firestore
    const db = getFirestore();
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    const userData = userDoc.data();

    if (!userData || userData.role !== 'admin') {
      return NextResponse.json(
        { error: 'Acesso negado. Esta conta não tem permissão de administrador.' },
        { status: 403 }
      );
    }

    // 3. Cria o cookie de sessão Firebase (válido por 7 dias)
    const sessionCookie = await getAuth().createSessionCookie(idToken, {
      expiresIn: SESSION_COOKIE_DURATION,
    });

    // 4. Define o cookie na resposta
    const response = NextResponse.json({ ok: true });
    response.cookies.set('__session', sessionCookie, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path:     '/studio',
      maxAge:   SESSION_COOKIE_DURATION / 1000,
    });

    return response;
  } catch (err) {
    console.error('[Studio Session] Erro:', err);
    return NextResponse.json(
      { error: 'Falha na autenticação. Tente novamente.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /studio/api/session
 * Encerra a sessão do Studio (logout).
 */
export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set('__session', '', {
    httpOnly: true,
    path:     '/studio',
    maxAge:   0,
  });
  return response;
}
