'use client';

import { useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useGeo } from '@/lib/i18n/GeoContext';

import ProductCard from '@/components/ProductCard';
import CategoryCarousel from '@/components/CategoryCarousel';

export interface Product {
  id: string;
  name: string;
  price: number;
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
  const [products] = useState<Product[]>(initialProducts || []);
  const searchParams = useSearchParams();
  const { t, tp } = useGeo();

  // 1. Captura filtros da URL em tempo real
  const searchQuery = searchParams.get('search') || '';
  const categoryParam = searchParams.get('category');
  
  // Se não houver categoria na URL, ou se for a tradução de "Todos", usamos o valor padrão
  const allLabel = t('allCategories');
  const isAllSelected = !categoryParam || categoryParam.toLowerCase() === allLabel.toLowerCase();
  const categoryQuery = isAllSelected ? allLabel : categoryParam;

  // 2. FILTRO REATIVO (sem recarregar a página)
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = searchQuery
        ? product.name?.toLowerCase().includes(searchQuery.toLowerCase())
        : true;
      const matchesCategory = isAllSelected || product.category?.toLowerCase() === categoryQuery?.toLowerCase();
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, categoryQuery, isAllSelected]);

  return (
    <div className="bg-white min-h-screen font-sans">
      <div className="pt-4 md:pt-4 pb-[28px] md:pb-10">
        <div className="w-full px-3 md:px-5">
          
          {/* Carrossel de Categorias */}
          <CategoryCarousel />

          {/* Seção de Produtos */}
          <section className="mt-1 md:mt-4"> 
            
            {/* Mensagem de "Nada encontrado" */}
            {filteredProducts.length === 0 && (
              <div className="text-center py-32 animate-in fade-in duration-700">
                <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#777]">
                  {t('noResults')} "<span className="text-[#fe7302]">{searchQuery || tp(categoryQuery)}</span>"
                </p>
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
