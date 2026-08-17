import React from 'react';
import { adminDb } from '@/lib/firebaseAdmin';
import { BlogPost } from '@/lib/types/blog';
import { notFound } from 'next/navigation';
import CategoryCarousel from '@/components/CategoryCarousel';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BookOpen } from 'lucide-react';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const postsSnapshot = await adminDb.collection('blog_posts')
    .where('slug', '==', params.slug)
    .where('status', '==', 'published')
    .limit(1)
    .get();

  if (postsSnapshot.empty) {
    return { title: 'Post não encontrado | Camisa Vetor' };
  }

  const post = postsSnapshot.docs[0].data() as BlogPost;

  const rawTitle = post.seoMetadata?.title || post.title || '';
  const title = `${rawTitle} | Blog Camisa Vetor`;
  const cleanExcerpt = post.content ? post.content.replace(/<[^>]*>/g, '').slice(0, 160) : '';
  const description = post.seoMetadata?.description || (post as any).excerpt || cleanExcerpt || '';
  const url = `https://camisavetor.com.br/blog/${params.slug}`;
  const coverImageUrl = post.coverImage || 'https://camisavetor.com.br/icon.png';

  const imageType = coverImageUrl.endsWith('.png') ? 'image/png' : 'image/jpeg';

  return {
    title,
    description,
    keywords: post.seoMetadata?.keywords?.join(', '),
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: 'article',
      locale: 'pt_BR',
      url,
      title: rawTitle,
      description,
      siteName: 'Camisa Vetor',
      images: [
        {
          url: coverImageUrl,
          secureUrl: coverImageUrl,
          width: 1200,
          height: 630,
          type: imageType,
          alt: rawTitle,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: rawTitle,
      description,
      images: [coverImageUrl],
    },
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

  // Busca os artigos recentes para a coluna lateral (excluindo o atual)
  let recentPosts: BlogPost[] = [];
  try {
    let recentSnapshot;
    try {
      recentSnapshot = await adminDb.collection('blog_posts')
        .orderBy('createdAt', 'desc')
        .limit(8)
        .get();
    } catch {
      recentSnapshot = await adminDb.collection('blog_posts').get();
    }

    recentPosts = recentSnapshot.docs
      .map(doc => {
        const data = doc.data();
        const rawDate: any = data.createdAt;
        const createdAtMs = typeof rawDate === 'number'
          ? rawDate
          : typeof rawDate === 'string'
          ? new Date(rawDate).getTime()
          : rawDate?.seconds
          ? rawDate.seconds * 1000
          : Date.now();

        return {
          id: doc.id,
          ...data,
          createdAt: isNaN(createdAtMs) ? Date.now() : createdAtMs,
        } as BlogPost;
      })
      .filter(p => p.status === 'published' && p.slug !== params.slug);

    recentPosts.sort((a, b) => b.createdAt - a.createdAt);
    recentPosts = recentPosts.slice(0, 5);
  } catch (err) {
    console.error("Erro ao buscar artigos recentes:", err);
  }

  const formatDate = (val: any) => {
    if (!val) return 'Data não definida';
    const d = new Date(typeof val === 'number' ? val : val.seconds ? val.seconds * 1000 : val);
    return isNaN(d.getTime()) ? 'Data não definida' : d.toLocaleDateString('pt-BR');
  };

  const postTitle = post.seoMetadata?.title || post.title || '';
  const cleanExcerpt = post.content ? post.content.replace(/<[^>]*>/g, '').slice(0, 160) : '';
  const postDescription = post.seoMetadata?.description || (post as any).excerpt || cleanExcerpt || '';
  const postUrl = `https://camisavetor.com.br/blog/${params.slug}`;
  const postCoverImage = post.coverImage || 'https://camisavetor.com.br/icon.png';

  const rawCreatedAt: any = post.createdAt;
  const createdAtDate = typeof rawCreatedAt === 'number'
    ? new Date(rawCreatedAt)
    : rawCreatedAt?.seconds
    ? new Date(rawCreatedAt.seconds * 1000)
    : new Date();

  const blogPostJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: postTitle,
    description: postDescription,
    image: [postCoverImage],
    datePublished: isNaN(createdAtDate.getTime()) ? new Date().toISOString() : createdAtDate.toISOString(),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': postUrl,
    },
    author: {
      '@type': 'Organization',
      name: 'Camisa Vetor',
      url: 'https://camisavetor.com.br',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Camisa Vetor',
      logo: {
        '@type': 'ImageObject',
        url: 'https://camisavetor.com.br/logo.svg',
      },
    },
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col font-sans">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostJsonLd) }}
      />
      <div className="pt-4 md:pt-4 pb-[28px] md:pb-10">
        <div className="w-full px-3 md:px-5">
          <CategoryCarousel />
        </div>
      </div>

      <main className="flex-grow w-full pt-2 md:pt-4 pb-24">
        <div className="max-w-[1360px] mx-auto px-4 md:px-6">
          <div className="flex flex-col lg:flex-row gap-10 lg:gap-14 items-start">
            
            {/* COLUNA PRINCIPAL: ARTIGO */}
            <article className="flex-1 w-full min-w-0 max-w-3xl">
              <header className="mb-8 text-left">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-[#111] mb-4 leading-[1.15] tracking-tight">
                  {post.title}
                </h1>
                <span className="text-[#fe7302] font-extrabold tracking-widest text-[11px] uppercase block">
                  Publicado em {formatDate(post.createdAt)}
                </span>
              </header>
              
              {post.coverImage && (
                <div className="relative w-full aspect-square rounded-3xl overflow-hidden mb-12 border border-gray-100 shadow-xl">
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
                .blog-content h2 { font-size: 2rem; font-weight: 900; margin-top: 3rem; margin-bottom: 1.25rem; color: #111; line-height: 1.2; }
                .blog-content h3 { font-size: 1.35rem; font-weight: 800; margin-top: 2.25rem; margin-bottom: 0.85rem; color: #333; }
                .blog-content p { margin-bottom: 1.5rem; line-height: 1.8; color: #4a4a4a; font-size: 1.05rem; }
                .blog-content ul { margin-bottom: 1.5rem; padding-left: 1.5rem; list-style-type: disc; color: #4a4a4a; font-size: 1.05rem; }
                .blog-content li { margin-bottom: 0.6rem; }
                .blog-content strong { color: #111; font-weight: 800; }
                .blog-content a { color: #fe7302; text-decoration: underline; font-weight: 600; transition: color 0.2s; }
                .blog-content a:hover { color: #ff9800; }
                .blog-content blockquote { border-left: 4px solid #fe7302; padding-left: 1.5rem; margin-left: 0; margin-right: 0; font-style: italic; color: #666; }
                .blog-content img { border-radius: 1rem; margin: 2rem 0; width: 100%; height: auto; border: 1px solid rgba(0,0,0,0.05); }
              `}} />
            </article>

            {/* COLUNA LATERAL: ARTIGOS RECENTES */}
            <aside className="w-full lg:w-[360px] xl:w-[380px] flex-shrink-0">
              <div className="bg-[#111111] border border-white/10 rounded-3xl p-6 shadow-2xl text-white">
                
                {/* CABEÇALHO DA LATERAL */}
                <div className="flex items-center gap-2.5 pb-4 mb-6 border-b border-white/10">
                  <BookOpen size={18} className="text-[#fe7302]" />
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white">
                    Artigos Recentes
                  </h3>
                </div>

                {/* LISTA DE POSTS RECENTES */}
                {recentPosts.length === 0 ? (
                  <p className="text-xs text-gray-500 py-4 text-center">Nenhum outro artigo recente encontrado.</p>
                ) : (
                  <div className="space-y-3">
                    {recentPosts.map(recent => (
                      <Link 
                        key={recent.id || recent.slug} 
                        href={`/blog/${recent.slug}`}
                        className="group flex items-center gap-3.5 p-2.5 rounded-2xl hover:bg-white/5 transition-all duration-200 border border-transparent hover:border-white/10"
                      >
                        {recent.coverImage ? (
                          <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-black/40 border border-white/10">
                            <Image 
                              src={recent.coverImage} 
                              alt={recent.title} 
                              fill 
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        ) : (
                          <div className="w-20 h-20 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-[#fe7302] font-black text-xs">CV</span>
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-gray-200 group-hover:text-[#fe7302] transition-colors leading-snug line-clamp-2 mb-1.5">
                            {recent.title}
                          </h4>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                            {formatDate(recent.createdAt)}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {/* LINK VER TODOS OS ARTIGOS */}
                <div className="mt-6 pt-4 border-t border-white/10">
                  <Link 
                    href="/blog"
                    className="flex items-center justify-center gap-2 w-full py-3 bg-black border border-white/15 rounded-xl text-[11px] font-bold uppercase tracking-wider text-white hover:border-[#fe7302] hover:text-[#fe7302] transition-all shadow-sm group"
                  >
                    Ver Todos os Artigos
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform text-[#fe7302]" />
                  </Link>
                </div>

              </div>
            </aside>

          </div>
        </div>
      </main>
    </div>
  );
}
