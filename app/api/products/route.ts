import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { adminDb } from '@/lib/firebaseAdmin';
import { formatTitleCase } from '@/lib/stringUtils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const productsSnap = await adminDb.collection('products').orderBy('createdAt', 'desc').get();
    const products = productsSnap.docs.map(doc => {
      const data = doc.data();
      const rawCreated = data.createdAt;
      const rawUpdated = data.updatedAt;

      let createdTime = 0;
      if (rawCreated?.toMillis) {
        createdTime = rawCreated.toMillis();
      } else if (rawCreated?.seconds) {
        createdTime = rawCreated.seconds * 1000;
      } else if (typeof rawCreated === 'string' || typeof rawCreated === 'number') {
        createdTime = new Date(rawCreated).getTime() || 0;
      } else if (rawUpdated?.toMillis) {
        createdTime = rawUpdated.toMillis();
      } else if (rawUpdated?.seconds) {
        createdTime = rawUpdated.seconds * 1000;
      } else if (typeof rawUpdated === 'string' || typeof rawUpdated === 'number') {
        createdTime = new Date(rawUpdated).getTime() || 0;
      } else {
        createdTime = Date.now();
      }

      return {
        id: doc.id,
        name: formatTitleCase(data.name || 'Sem nome'),
        price: Number(data.price) || 0,
        isFree: Boolean(data.isFree) || Number(data.price) === 0,
        category: data.category || 'Geral',
        slug: data.slug || doc.id,
        createdAt: createdTime,
        urls: { 
          capa: data.urls?.capa || data.urls?.destaque || '',
          destaque: data.urls?.destaque || '',
        },
      };
    });
    
    return NextResponse.json(
      { products },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      }
    );
  } catch (error: any) {
    console.error('Erro ao buscar produtos:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    try {
      revalidatePath('/');
      revalidatePath('/catalog');
    } catch {}

    return NextResponse.json({ success: true, revalidated: true, now: Date.now() });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
