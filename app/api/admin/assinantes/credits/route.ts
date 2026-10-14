import { NextResponse } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';
import { adminDb, adminAuth } from '@/lib/firebaseAdmin';

const ADMIN_EMAIL = 'camisavetor@gmail.com';

async function verificarAdmin(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.split('Bearer ')[1];
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    if (decoded.email !== ADMIN_EMAIL) return null;
    return decoded;
  } catch {
    return null;
  }
}

// POST — Ajuste manual e atômico de créditos do assinante
export async function POST(req: Request) {
  try {
    const decoded = await verificarAdmin(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { userId, action, amount } = body;

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ error: 'ID do usuário não fornecido' }, { status: 400 });
    }

    const numAmount = Math.max(0, parseInt(amount, 10) || 0);
    if (!['add', 'subtract', 'set'].includes(action)) {
      return NextResponse.json({ error: 'Ação inválida. Use add, subtract ou set' }, { status: 400 });
    }

    const userRef = adminDb.collection('users').doc(userId);

    const result = await adminDb.runTransaction(async (tx) => {
      const snap = await tx.get(userRef);
      if (!snap.exists) {
        throw new Error('Usuário não encontrado');
      }

      const current = Number(snap.data()?.availableCredits) || 0;
      let newCredits = current;

      if (action === 'add') {
        newCredits = current + numAmount;
      } else if (action === 'subtract') {
        newCredits = Math.max(0, current - numAmount);
      } else if (action === 'set') {
        newCredits = numAmount;
      }

      tx.set(
        userRef,
        {
          availableCredits: newCredits,
          lastCreditAdjustment: {
            action,
            amount: numAmount,
            previousCredits: current,
            newCredits,
            adjustedAt: Timestamp.now(),
            adjustedBy: decoded.email,
          },
        },
        { merge: true }
      );

      return { previousCredits: current, newCredits };
    });

    return NextResponse.json({
      success: true,
      userId,
      previousCredits: result.previousCredits,
      newCredits: result.newCredits,
    });
  } catch (error: any) {
    console.error('Erro ao ajustar créditos do assinante:', error);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}
