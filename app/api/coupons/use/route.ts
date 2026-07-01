import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(req: Request) {
  try {
    const { code } = await req.json();

    if (!code) {
      return NextResponse.json({ success: false, error: 'Código não informado.' }, { status: 400 });
    }

    const couponRef = adminDb.collection('coupons').doc(code.trim().toUpperCase());
    await couponRef.update({
      usedCount: FieldValue.increment(1),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erro ao registrar uso do cupom:', error);
    return NextResponse.json({ success: false, error: 'Erro ao registrar uso.' }, { status: 500 });
  }
}
