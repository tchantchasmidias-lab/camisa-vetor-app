import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export async function POST(req: NextRequest) {
  try {
    const postData = await req.json();
    
    if (!postData || !postData.title) {
      return NextResponse.json({ error: 'Post data is missing or invalid' }, { status: 400 });
    }

    const docRef = await adminDb.collection('blog_posts').add({
      ...postData,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return NextResponse.json({ success: true, id: docRef.id });
  } catch (error: any) {
    console.error('Error publishing blog post:', error);
    return NextResponse.json({ error: error.message || 'Error publishing post' }, { status: 500 });
  }
}
