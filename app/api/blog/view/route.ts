import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import * as admin from 'firebase-admin';

export async function POST(req: Request) {
  try {
    const { slug } = await req.json();
    if (!slug) {
      return NextResponse.json({ error: 'Slug é obrigatório' }, { status: 400 });
    }

    const postsSnapshot = await adminDb.collection('blog_posts')
      .where('slug', '==', slug)
      .limit(1)
      .get();

    if (postsSnapshot.empty) {
      return NextResponse.json({ error: 'Artigo não encontrado' }, { status: 404 });
    }

    const docRef = postsSnapshot.docs[0].ref;
    await docRef.update({
      views: admin.firestore.FieldValue.increment(1),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erro ao incrementar contagem de visualizações do artigo:', error);
    return NextResponse.json({ error: error.message || 'Erro ao incrementar visualização' }, { status: 500 });
  }
}
