import React from 'react';
import { adminDb } from '@/lib/firebaseAdmin';
import { BlogPost } from '@/lib/types/blog';
import { notFound } from 'next/navigation';
import CategoryCarousel from '@/components/CategoryCarousel';
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
    <div className="min-h-screen bg-white text-gray-900 flex flex-col font-sans">
      <div className="pt-4 md:pt-4 pb-[28px] md:pb-10">
        <div className="w-full px-3 md:px-5">
          <CategoryCarousel />
        </div>
      </div>

      <main className="flex-grow w-full pt-2 md:pt-4 pb-20">
        <article className="max-w-3xl mx-auto px-6">
          <header className="mb-10 text-left">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-[#111] mb-4 leading-[1.15] tracking-tight">
              {post.title}
            </h1>
            <span className="text-[#fe7302] font-extrabold tracking-widest text-[11px] uppercase block">
               Publicado em {
                 (() => {
                   const rawDate: any = post.createdAt;
                   const createdAtMs = typeof rawDate === 'number'
                     ? rawDate
                     : typeof rawDate === 'string'
                     ? new Date(rawDate).getTime()
                     : rawDate?.seconds
                     ? rawDate.seconds * 1000
                     : Date.now();
                   const d = new Date(createdAtMs);
                   return isNaN(d.getTime()) ? 'Data não definida' : d.toLocaleDateString('pt-BR');
                 })()
               }
            </span>
          </header>
          
          {post.coverImage && (
            <div className="relative w-full h-[40vh] md:h-[60vh] rounded-3xl overflow-hidden mb-16 border border-gray-100 shadow-xl">
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
            .blog-content h2 { font-size: 2.25rem; font-weight: 900; margin-top: 3.5rem; margin-bottom: 1.5rem; color: #111; line-height: 1.2; }
            .blog-content h3 { font-size: 1.5rem; font-weight: 800; margin-top: 2.5rem; margin-bottom: 1rem; color: #333; }
            .blog-content p { margin-bottom: 1.75rem; line-height: 1.8; color: #555; font-size: 1.125rem; }
            .blog-content ul { margin-bottom: 1.75rem; padding-left: 1.5rem; list-style-type: disc; color: #555; font-size: 1.125rem; }
            .blog-content li { margin-bottom: 0.75rem; }
            .blog-content strong { color: #111; font-weight: 800; }
            .blog-content a { color: #fe7302; text-decoration: underline; font-weight: 600; transition: color 0.2s; }
            .blog-content a:hover { color: #ff9800; }
            .blog-content blockquote { border-left: 4px solid #fe7302; padding-left: 1.5rem; margin-left: 0; margin-right: 0; font-style: italic; color: #666; }
            .blog-content img { border-radius: 1rem; margin: 2rem 0; width: 100%; height: auto; border: 1px solid rgba(0,0,0,0.05); }
          `}} />
        </article>
      </main>
    </div>
  );
}
