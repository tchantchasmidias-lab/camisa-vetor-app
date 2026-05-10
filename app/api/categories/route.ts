import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export async function GET() {
  try {
    const categoriesSnap = await adminDb.collection('categories').orderBy('name', 'asc').get();
    const categories = categoriesSnap.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || '',
        imageUrl: data.imageUrl || ''
      };
    });
    
    return NextResponse.json({ categories });
  } catch (error: any) {
    console.error('Erro ao buscar categorias:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
