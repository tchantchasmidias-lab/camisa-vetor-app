import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export async function GET() {
  try {
    const postsSnapshot = await adminDb.collection('blog_posts')
      .orderBy('createdAt', 'desc')
      .get();

    const posts = postsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json(posts);
  } catch (error: any) {
    console.error('Error fetching blog posts:', error);
    return NextResponse.json({ error: error.message || 'Error fetching posts' }, { status: 500 });
  }
}
