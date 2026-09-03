'use client';

import { useState, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useGeo } from '@/lib/i18n/GeoContext';
import { normalizeSearchTerm } from '@/lib/stringUtils';

import ProductCard from '@/components/ProductCard';
import CategoryCarousel from '@/components/CategoryCarousel';

const ReviewsSection = dynamic(() => import('@/components/ReviewsSection'), {
  loading: () => <div className="h-48" />,
  ssr: true,
});

export interface Product {
  id: string;
  name: string;
  price: number;
  isFree?: boolean;
  category: string;
  slug?: string;
  createdAt?: number;
  urls: {
    capa: string;
    destaque: string;
  };
}

interface HomeClientProps {
  initialProducts: Product[];
}

function HomeClientContent({ initialProducts }: HomeClientProps) {
  const products = initialProducts || [];
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t, tp } = useGeo();

  // 1. Captura filtros da URL em tempo real de forma defensiva
  const searchQuery = (searchParams?.get ? searchParams.get('search') : null) || '';
  const categoryParam = searchParams?.get ? searchParams.get('category') : null;
  
  // Se não houver categoria na URL, ou se for a tradução de "Todos", usamos o valor padrão
  const allLabel = t('allCategories');
  const normalizedCategoryParam = normalizeSearchTerm(categoryParam);
  const normalizedAllLabel = normalizeSearchTerm(allLabel);
  const isAllSelected = !categoryParam || normalizedCategoryParam === normalizedAllLabel;
  const categoryQuery = isAllSelected ? allLabel : categoryParam;

  const normalizedQuery = normalizeSearchTerm(searchQuery);
  const normalizedCategoryQuery = normalizeSearchTerm(categoryQuery);

  // 2. FILTRO REATIVO NORMALIZADO (sem acentos e case-insensitive)
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      if (!product) return false;

      // 2.1 Verificação de Busca por Texto com Suporte Abrangente
      let matchesSearch = true;
      if (normalizedQuery) {
        const normalizedName = normalizeSearchTerm(product.name || '');
        const normalizedDescription = normalizeSearchTerm((product as any).description || (product as any).seoDescription || '');
        const normalizedCategory = normalizeSearchTerm(product.category || '');
        const normalizedTags = Array.isArray((product as any).tags)
          ? (product as any).tags.map((tag: any) => normalizeSearchTerm(String(tag))).join(' ')
          : normalizeSearchTerm((product as any).tags || (product as any).keywords || '');

        matchesSearch =
          normalizedName.includes(normalizedQuery) ||
          normalizedDescription.includes(normalizedQuery) ||
          normalizedCategory.includes(normalizedQuery) ||
          normalizedTags.includes(normalizedQuery);
      }

      // 2.2 Verificação de Categoria Normalizada
      const matchesCategory =
        isAllSelected ||
        normalizeSearchTerm(product.category || '') === normalizedCategoryQuery;

      return matchesSearch && matchesCategory;
    });
  }, [products, normalizedQuery, normalizedCategoryQuery, isAllSelected]);

  const handleClearSearch = () => {
    router.push('/');
  };

  return (
    <div className="bg-white min-h-screen font-sans">
      <div className="pt-4 md:pt-4 pb-[28px] md:pb-10">
        <div className="w-full px-3 md:px-5">
          
          {/* Carrossel de Categorias */}
          <CategoryCarousel />

          {/* Cabeçalho Dinâmico de Resultados de Busca Integrado ao Fundo Branco */}
          {searchQuery && (
            <div className="flex flex-col items-center justify-center text-center my-6 px-4 bg-transparent animate-in fade-in duration-500">
              {/* Breadcrumbs */}
              <nav className="text-xs md:text-sm font-medium text-slate-500 mb-2 flex items-center justify-center gap-2 flex-wrap">
                <span className="hover:text-slate-900 transition-colors cursor-pointer" onClick={handleClearSearch}>Início</span>
                <span className="text-slate-400">&gt;</span>
                <span className="hover:text-slate-900 transition-colors cursor-pointer" onClick={handleClearSearch}>Catálogo</span>
                <span className="text-slate-400">&gt;</span>
                <span className="text-[#fe7302] font-bold capitalize">{searchQuery}</span>
              </nav>

              {/* Título Grande em Preto/Grafite Escuro */}
              <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 capitalize tracking-tight">
                {searchQuery}
              </h1>

              {/* Contador de Resultados */}
              <p className="text-sm md:text-base font-normal text-slate-600 mt-1">
                <span className="font-semibold text-slate-800">{filteredProducts.length}</span> {filteredProducts.length === 1 ? 'arte encontrada' : 'artes encontradas'} para &quot;<span className="font-semibold text-slate-800">{searchQuery}</span>&quot;
              </p>
            </div>
          )}

          {/* Seção de Produtos */}
          <section className="mt-1 md:mt-4"> 
            
            {/* Mensagem de "Nada encontrado" */}
            {filteredProducts.length === 0 && (
              <div className="text-center py-20 px-4 animate-in fade-in duration-700">
                <div className="w-16 h-16 bg-orange-50 text-[#fe7302] rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                  🔍
                </div>
                <h3 className="text-lg font-bold text-[#0f172a] mb-2">
                  Nenhum resultado encontrado
                </h3>
                <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
                  Não encontramos nenhuma arte para &quot;<span className="font-semibold text-[#fe7302]">{searchQuery || tp(categoryQuery)}</span>&quot;. Tente buscar por termos mais genéricos como formatura, futebol ou gospel.
                </p>
                <button
                  onClick={handleClearSearch}
                  className="inline-flex items-center gap-2 bg-[#fe7302] text-white px-6 py-3 rounded-full font-bold uppercase tracking-wider text-[11px] shadow-lg shadow-orange-500/20 hover:bg-black transition-all cursor-pointer"
                >
                  <span>Ver Todos os Vetores</span>
                </button>
              </div>
            )}

            {/* Grid de Produtos SSR — Renderizado no servidor com 0ms de atraso */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {filteredProducts.map((product, index) => (
                <ProductCard key={product.id} product={product} priority={index < 4} />
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* ── PROVA SOCIAL ── */}
      <ReviewsSection products={products} />
    </div>
  );
}

export default function HomeClient({ initialProducts }: HomeClientProps) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#fe7302] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <HomeClientContent initialProducts={initialProducts} />
    </Suspense>
  );
}
