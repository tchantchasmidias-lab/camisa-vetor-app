'use client';

import { useState, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useGeo } from '@/lib/i18n/GeoContext';
import { normalizeSearchTerm } from '@/lib/stringUtils';

import ProductCard from '@/components/ProductCard';
import CategoryCarousel from '@/components/CategoryCarousel';
import ProductRail from '@/components/home/ProductRail';

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

// Configuração dos 7 trilhos da home page
// Cada entrada define: título exibido, slugs de categoria aceitos, e href do "Ver todos →"
const RAIL_CONFIGS = [
  {
    title: 'Novidades',
    // Novidades: todos os produtos, ordenados por createdAt desc — feito na função de filtro
    categoryKeys: null as string[] | null,
    viewAllHref: '/',
    limit: 20,
  },
  {
    title: 'Interclasse',
    categoryKeys: ['interclasse'],
    viewAllHref: '/?category=Interclasse',
    limit: 20,
  },
  {
    title: 'Cavalgada',
    categoryKeys: ['cavalgada'],
    viewAllHref: '/?category=Cavalgada',
    limit: 20,
  },
  {
    title: 'Cristã',
    categoryKeys: ['crista', 'cristas'],
    viewAllHref: '/?category=Crist%C3%A3',
    limit: 20,
  },
  {
    title: 'Católica',
    categoryKeys: ['catolica', 'catolicismo'],
    viewAllHref: '/?category=Cat%C3%B3lica',
    limit: 20,
  },
  {
    title: 'Caça Esportiva',
    categoryKeys: ['caca esportiva', 'cacaesportiva', 'pesca esportiva', 'pescaesportiva'],
    viewAllHref: '/?category=Ca%C3%A7a+Esportiva',
    limit: 20,
  },
  {
    title: 'Terceirão',
    categoryKeys: ['terceirao', 'terceiro'],
    viewAllHref: '/?category=Tercair%C3%A3o',
    limit: 20,
  },
] as const;

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

  // Detecta se a home está em modo "default" (sem busca nem filtro)
  const isDefaultHome = !searchQuery && isAllSelected;

  // 2. FILTRO REATIVO NORMALIZADO (sem acentos e case-insensitive) — usado quando há busca/filtro ativo
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

  // 3. SEGMENTOS DOS 7 TRILHOS — computados apenas na home default
  const railSegments = useMemo(() => {
    if (!isDefaultHome) return [];

    return RAIL_CONFIGS.map(rail => {
      let segment: Product[];

      if (rail.categoryKeys === null) {
        // Novidades: todos os produtos, já ordenados por createdAt desc em app/page.tsx
        segment = products.slice(0, rail.limit);
      } else {
        // Filtra por categoria usando normalizeSearchTerm para tolerância a acentos/hífens
        segment = products
          .filter(p => {
            if (!p?.category) return false;
            const normCat = normalizeSearchTerm(p.category).replace(/-/g, ' ');
            return rail.categoryKeys!.some(key => normCat === key.replace(/-/g, ' '));
          })
          .slice(0, rail.limit);
      }

      return { ...rail, products: segment };
    });
  }, [products, isDefaultHome]);

  const handleClearSearch = () => {
    router.push('/');
  };

  return (
    <div className="bg-white min-h-screen font-sans">
      <div className="pt-4 md:pt-4 pb-[28px] md:pb-10">
        <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Carrossel de Categorias */}
          <CategoryCarousel />

          {/* ── HOME DEFAULT: 7 Trilhos de Produtos ── */}
          {isDefaultHome && (
            <div className="mt-4 space-y-2">
              {railSegments.map(rail => (
                <ProductRail
                  key={rail.title}
                  title={rail.title}
                  products={rail.products}
                  viewAllHref={rail.viewAllHref}
                />
              ))}
            </div>
          )}

          {/* ── MODO BUSCA/FILTRO ── */}
          {!isDefaultHome && (
            <>
              {/* Cabeçalho Dinâmico de Resultados de Busca */}
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

              {/* Seção de Produtos Filtrados */}
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

                {/* Grid de Produtos SSR */}
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                  {filteredProducts.map((product, index) => (
                    <ProductCard key={product.id} product={product} priority={index < 4} />
                  ))}
                </div>
              </section>
            </>
          )}
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
