'use client';

import { useState, useEffect, Suspense, useMemo } from 'react';
import { collection, getDocsFromServer } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useSearchParams } from 'next/navigation';
import { useGeo } from '@/lib/i18n/GeoContext';

import ProductCard from '@/components/ProductCard';
import ProductCardSkeleton from '@/components/ProductCardSkeleton';
import CategoryCarousel from '@/components/CategoryCarousel';

// Interface para garantir consistência dos dados
interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  urls: {
    capa: string;
    destaque: string;
  };
}

function HomeContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const searchParams = useSearchParams();
  const { t, tp } = useGeo();

  // 1. Captura filtros da URL em tempo real
  const searchQuery = searchParams.get('search') || '';
  const categoryParam = searchParams.get('category');
  
  // Se não houver categoria na URL, ou se for a tradução de "Todos", usamos o valor padrão
  const allLabel = t('allCategories');
  const isAllSelected = !categoryParam || categoryParam.toLowerCase() === allLabel.toLowerCase();
  const categoryQuery = isAllSelected ? allLabel : categoryParam;

  const fetchProducts = async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const querySnapshot = await getDocsFromServer(collection(db, "products"));

      const productsData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || 'Sem nome',
          price: Number(data.price) || 0,
          category: data.category || 'Geral',
          createdAt: data.createdAt?.toMillis?.() ?? 0,
          urls: {
            capa: data.urls?.capa || data.urls?.destaque || '',
            destaque: data.urls?.destaque || '',
          },
        };
      }) as any[];

      // Ordena: mais recentes primeiro
      productsData.sort((a, b) => b.createdAt - a.createdAt);

      setProducts(productsData);
    } catch (err) {
      console.error("Erro ao carregar produtos:", err);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // 2. FILTRO REATIVO: Filtra a lista sem precisar recarregar a página
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = isAllSelected || product.category.toLowerCase() === categoryQuery.toLowerCase();
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

            {/* Tela de Erro de Conexão */}
            {hasError && !isLoading && (
              <div className="flex flex-col items-center justify-center py-32 gap-4 animate-in fade-in duration-700">
                <span className="text-5xl">😢</span>
                <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#aaa] text-center">
                  Falha na conexão.<br />Verifique sua internet.
                </p>
                <button
                  onClick={fetchProducts}
                  className="mt-2 px-6 py-2 bg-[#fe7302] text-white text-[11px] font-bold uppercase tracking-[0.15em] rounded-full hover:bg-orange-600 transition-colors duration-200"
                >
                  Tentar novamente
                </button>
              </div>
            )}
            
            {/* Mensagem de "Nada encontrado" com Tipografia Google */}
            {!isLoading && !hasError && filteredProducts.length === 0 && (
              <div className="text-center py-32 animate-in fade-in duration-700">
                <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#777]">
                  {t('noResults')} "<span className="text-[#fe7302]">{searchQuery || tp(categoryQuery)}</span>"
                </p>
              </div>
            )}

            {/* Grid: 1 coluna no mobile, 3 no tablet e 5 no desktop */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {isLoading ? (
                // Skeletons enquanto carrega
                [...Array(8)].map((_, i) => <ProductCardSkeleton key={i} />)
              ) : (
                // Lista Filtrada (LCP prioritário para os primeiros 4 cards da tela)
                filteredProducts.map((product, index) => (
                  <ProductCard key={product.id} product={product} priority={index < 4} />
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

// Exportação com Boundary de Suspense (Obrigatório para useSearchParams)
export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#fe7302] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}