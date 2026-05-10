import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export async function GET() {
  try {
    const productsSnap = await adminDb.collection('products').orderBy('createdAt', 'desc').get();
    const products = productsSnap.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || 'Sem nome',
        price: Number(data.price) || 0,
        category: data.category || 'Geral',
        urls: { 
          capa: data.urls?.capa || data.urls?.destaque || '',
          destaque: data.urls?.destaque || '',
        },
      };
    });
    
    return NextResponse.json({ products });
  } catch (error: any) {
    console.error('Erro ao buscar produtos:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
