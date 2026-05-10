import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export async function POST(req: Request) {
  try {
    const { userId, nome, cpf, phone, email } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'ID de usuário ausente' }, { status: 400 });
    }

    const userRef = adminDb.collection('users').doc(userId);
    
    // Merge true ensures we don't overwrite other fields unnecessarily and handles creation if missing
    await userRef.set({
      ...(nome && { nome }),
      ...(cpf && { cpf }),
      ...(phone && { phone }),
      ...(email && { email }),
      updatedAt: new Date().toISOString()
    }, { merge: true });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erro ao salvar perfil do usuário:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
