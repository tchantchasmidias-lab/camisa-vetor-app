import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { adminDb } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const postData = await req.json();
    
    if (!postData || !postData.title) {
      return NextResponse.json({ error: 'Dados do post inválidos ou ausentes' }, { status: 400 });
    }

    const { id, ...dataToSave } = postData;

    let docId = id;
    const now = Date.now();

    if (docId) {
      // Atualiza post existente
      await adminDb.collection('blog_posts').doc(docId).set({
        ...dataToSave,
        updatedAt: now,
      }, { merge: true });
    } else {
      // Cria novo post
      const docRef = await adminDb.collection('blog_posts').add({
        ...dataToSave,
        createdAt: dataToSave.createdAt || now,
        updatedAt: now,
      });
      docId = docRef.id;
    }

    // Revalida o cache das rotas do blog
    try {
      revalidatePath('/blog');
      revalidatePath('/admin');
      if (dataToSave.slug) {
        revalidatePath(`/blog/${dataToSave.slug}`);
      }
    } catch {}

    return NextResponse.json({ success: true, id: docId });
  } catch (error: any) {
    console.error('Error publishing blog post:', error);
    return NextResponse.json({ error: error.message || 'Erro ao publicar post' }, { status: 500 });
  }
}
