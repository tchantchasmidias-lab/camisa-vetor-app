import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { adminDb } from '@/lib/firebaseAdmin';
import { BlogPost } from '@/lib/types/blog';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Blog - Camisa Vetor',
  description: 'Dicas, novidades e tutoriais sobre estampas, sublimação e vetores.',
};

export default async function BlogIndex() {
  let posts: BlogPost[] = [];
  
  try {
    const postsSnapshot = await adminDb.collection('blog_posts')
      .orderBy('createdAt', 'desc')
      .get();
      
    posts = postsSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as BlogPost))
      .filter(post => post.status === 'published');
  } catch (error: any) {
    console.error('Aviso de Build: O Firebase exige a criação de um Índice Composto para a busca do Blog.', error.message);
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col font-sans">
      <Header />
      <main className="flex-grow max-w-7xl mx-auto w-full px-6 pt-32 pb-24">
        <div className="mb-16 text-center">
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-[#fe7302] to-[#ff9800] mb-4">Blog</h1>
          <p className="text-gray-400 max-w-2xl mx-auto">Conteúdos, dicas e tutoriais exclusivos sobre design, vetores e sublimação para impulsionar o seu negócio.</p>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-20 bg-[#111] rounded-3xl border border-white/5">
            <h2 className="text-xl font-bold text-gray-500">Nenhum artigo publicado ainda.</h2>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map(post => (
              <Link href={`/blog/${post.slug}`} key={post.id} className="group flex flex-col bg-[#111] rounded-3xl border border-white/5 overflow-hidden hover:border-[#fe7302]/50 transition-all hover:-translate-y-2 hover:shadow-2xl hover:shadow-orange-600/10">
                <div className="relative w-full h-56 bg-black/50 overflow-hidden">
                  {post.coverImage ? (
                    <Image 
                      src={post.coverImage} 
                      alt={post.title} 
                      fill 
                      className="object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#111] to-[#222]">
                      <span className="text-orange-500/20 font-black text-6xl tracking-tighter">CV</span>
                    </div>
                  )}
                </div>
                <div className="p-8 flex flex-col flex-grow">
                  <span className="text-[10px] font-black text-[#fe7302] uppercase tracking-widest mb-3">
                    {new Date(post.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                  <h2 className="text-2xl font-bold mb-4 group-hover:text-[#fe7302] transition-colors">{post.title}</h2>
                  <p className="text-gray-400 text-sm line-clamp-3 mb-6">
                    {post.seoMetadata?.description}
                  </p>
                  <div className="mt-auto">
                    <span className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2 group-hover:text-[#fe7302] transition-colors">
                      Ler Artigo
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-1"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
