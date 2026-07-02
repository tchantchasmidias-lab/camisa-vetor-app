import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

// Verifica se o usuário é admin (mesmo email de config)
async function isAdmin(req: Request): Promise<boolean> {
  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) return false;
    const decoded = await adminAuth.verifyIdToken(token);
    const adminEmail = process.env.ADMIN_EMAIL || 'tchantchasmidias@gmail.com';
    return decoded.email === adminEmail;
  } catch {
    return false;
  }
}

// POST /api/coupons/manage — criar cupom
export async function POST(req: Request) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }
  try {
    const body = await req.json();
    const { action, code, type, value, minOrder, expiresAt, active } = body;

    if (!code) return NextResponse.json({ error: 'Código inválido.' }, { status: 400 });

    const ref = adminDb.collection('coupons').doc(code.trim().toUpperCase());

    if (action === 'create') {
      const existing = await ref.get();
      if (existing.exists) {
        return NextResponse.json({ error: 'Já existe um cupom com este código.' }, { status: 409 });
      }
      await ref.set({
        type: type || 'percent',
        value: parseFloat(value) || 0,
        minOrder: parseFloat(minOrder || '0') || 0,
        usedCount: 0,
        active: true,
        createdAt: FieldValue.serverTimestamp(),
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      });
      return NextResponse.json({ success: true });
    }

    if (action === 'toggle') {
      await ref.update({ active: active });
      return NextResponse.json({ success: true });
    }

    if (action === 'delete') {
      await ref.delete();
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Ação inválida.' }, { status: 400 });
  } catch (error: any) {
    console.error('Erro ao gerenciar cupom:', error);
    return NextResponse.json({ error: error.message || 'Erro interno.' }, { status: 500 });
  }
}
