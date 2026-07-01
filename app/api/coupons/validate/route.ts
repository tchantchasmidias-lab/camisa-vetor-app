import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export async function POST(req: Request) {
  try {
    const { code, cartTotal } = await req.json();

    if (!code || typeof cartTotal !== 'number') {
      return NextResponse.json({ valid: false, error: 'Dados inválidos.' }, { status: 400 });
    }

    const couponRef = adminDb.collection('coupons').doc(code.trim().toUpperCase());
    const snap = await couponRef.get();

    if (!snap.exists) {
      return NextResponse.json({ valid: false, error: 'Cupom não encontrado.' });
    }

    const coupon = snap.data()!;

    // Verifica se está ativo
    if (!coupon.active) {
      return NextResponse.json({ valid: false, error: 'Este cupom está desativado.' });
    }

    // Verifica expiração
    if (coupon.expiresAt) {
      const expiresAt = coupon.expiresAt.toDate ? coupon.expiresAt.toDate() : new Date(coupon.expiresAt);
      if (new Date() > expiresAt) {
        return NextResponse.json({ valid: false, error: 'Este cupom está expirado.' });
      }
    }

    // Verifica pedido mínimo
    if (coupon.minOrder && cartTotal < coupon.minOrder) {
      return NextResponse.json({
        valid: false,
        error: `Pedido mínimo de R$ ${Number(coupon.minOrder).toFixed(2).replace('.', ',')} para este cupom.`,
      });
    }

    // Calcula desconto
    let discount = 0;
    if (coupon.type === 'percent') {
      discount = (cartTotal * coupon.value) / 100;
    } else if (coupon.type === 'fixed') {
      discount = coupon.value;
    }

    // Garante que desconto nunca excede o total
    discount = Math.min(discount, cartTotal);
    const finalTotal = Math.max(0, cartTotal - discount);

    return NextResponse.json({
      valid: true,
      discount: parseFloat(discount.toFixed(2)),
      finalTotal: parseFloat(finalTotal.toFixed(2)),
      coupon: {
        code: snap.id,
        type: coupon.type,
        value: coupon.value,
        expiresAt: coupon.expiresAt ?? null,
      },
    });
  } catch (error: any) {
    console.error('Erro ao validar cupom:', error);
    return NextResponse.json({ valid: false, error: 'Erro interno ao validar cupom.' }, { status: 500 });
  }
}
