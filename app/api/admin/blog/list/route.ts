import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

function parseTimestamp(val: any): number {
  if (!val) return Date.now();
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const parsed = new Date(val).getTime();
    return isNaN(parsed) ? Date.now() : parsed;
  }
  if (typeof val.toDate === 'function') return val.toDate().getTime();
  if (typeof val.seconds === 'number') return val.seconds * 1000;
  if (typeof val._seconds === 'number') return val._seconds * 1000;
  return Date.now();
}

export async function GET() {
  try {
    let postsSnapshot;
    try {
      postsSnapshot = await adminDb.collection('blog_posts')
        .orderBy('createdAt', 'desc')
        .get();
    } catch {
      // Fallback sem orderBy caso falte índice ou campo no Firestore
      postsSnapshot = await adminDb.collection('blog_posts').get();
    }

    const posts = postsSnapshot.docs.map(doc => {
      const data = doc.data();
      const createdAt = parseTimestamp(data.createdAt);
      const updatedAt = parseTimestamp(data.updatedAt || data.createdAt);
      return {
        id: doc.id,
        ...data,
        createdAt,
        updatedAt,
      };
    });

    // Garante ordenação do mais recente para o mais antigo em memória
    posts.sort((a, b) => b.createdAt - a.createdAt);

    return NextResponse.json(posts);
  } catch (error: any) {
    console.error('Error fetching blog posts:', error);
    return NextResponse.json({ error: error.message || 'Error fetching posts' }, { status: 500 });
  }
}
