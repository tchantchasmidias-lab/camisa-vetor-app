import React from 'react';
import { adminDb } from '@/lib/firebaseAdmin';
import { BlogPost } from '@/lib/types/blog';
import { notFound } from 'next/navigation';
import Image from 'next/image';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const postsSnapshot = await adminDb.collection('blog_posts')
    .where('slug', '==', params.slug)
    .where('status', '==', 'published')
    .limit(1)
    .get();

  if (postsSnapshot.empty) {
    return { title: 'Post não encontrado' };
  }

  const post = postsSnapshot.docs[0].data() as BlogPost;

  return {
    title: post.seoMetadata?.title || post.title,
    description: post.seoMetadata?.description,
    keywords: post.seoMetadata?.keywords?.join(', '),
    openGraph: {
      title: post.seoMetadata?.title || post.title,
      description: post.seoMetadata?.description,
      images: post.coverImage ? [post.coverImage] : [],
    }
  };
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const postsSnapshot = await adminDb.collection('blog_posts')
    .where('slug', '==', params.slug)
    .where('status', '==', 'published')
    .limit(1)
    .get();

  if (postsSnapshot.empty) {
    notFound();
  }

  const post = postsSnapshot.docs[0].data() as BlogPost;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col font-sans">
      <main className="flex-grow w-full pt-32 pb-20">
        <article className="max-w-3xl mx-auto px-6">
          <header className="mb-12 text-center">
            <span className="text-[#fe7302] font-black tracking-widest text-[10px] uppercase mb-4 block">
               Publicado em {new Date(post.createdAt).toLocaleDateString('pt-BR')}
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-8 leading-tight">
              {post.title}
            </h1>
          </header>
          
          {post.coverImage && (
            <div className="relative w-full h-[40vh] md:h-[60vh] rounded-3xl overflow-hidden mb-16 border border-white/10 shadow-2xl">
              <Image 
                src={post.coverImage} 
                alt={post.title} 
                fill 
                className="object-cover"
                priority
              />
            </div>
          )}

          <div 
            className="blog-content"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
          <style dangerouslySetInnerHTML={{__html: `
            .blog-content h2 { font-size: 2.25rem; font-weight: 900; margin-top: 3.5rem; margin-bottom: 1.5rem; color: #fff; line-height: 1.2; }
            .blog-content h3 { font-size: 1.5rem; font-weight: 800; margin-top: 2.5rem; margin-bottom: 1rem; color: #eee; }
            .blog-content p { margin-bottom: 1.75rem; line-height: 1.8; color: #bbb; font-size: 1.125rem; }
            .blog-content ul { margin-bottom: 1.75rem; padding-left: 1.5rem; list-style-type: disc; color: #bbb; font-size: 1.125rem; }
            .blog-content li { margin-bottom: 0.75rem; }
            .blog-content strong { color: #fff; font-weight: 800; }
            .blog-content a { color: #fe7302; text-decoration: underline; font-weight: 600; transition: color 0.2s; }
            .blog-content a:hover { color: #ff9800; }
            .blog-content blockquote { border-left: 4px solid #fe7302; padding-left: 1.5rem; margin-left: 0; margin-right: 0; font-style: italic; color: #ccc; }
            .blog-content img { border-radius: 1rem; margin: 2rem 0; width: 100%; height: auto; border: 1px solid rgba(255,255,255,0.1); }
          `}} />
        </article>
      </main>
    </div>
  );
}
