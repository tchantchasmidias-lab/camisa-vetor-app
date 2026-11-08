'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import type { Product } from '@/components/HomeClient';

interface ProductRailProps {
  title: string;
  products: Product[];
  viewAllHref: string;
  isFirst?: boolean;
}

// Larguras dos cards:
//   Mobile  (~390px viewport): w-[44vw]  => ~2.2 cards visíveis (indica continuacao)
//   Tablet  (md ~768px)      : w-[31%]   => 3 cards visíveis com gap-3
//   Desktop (lg ~1024px+)    : w-[calc((100%-4*1rem)/5)] => exatos 5 cards com gap-4

const INITIAL_VISIBLE_COUNT = 8;

export default function ProductRail({ title, products, viewAllHref, isFirst = false }: ProductRailProps) {
  const railRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);

  if (!products || products.length === 0) return null;

  const loadAll = () => {
    if (visibleCount < products.length) {
      setVisibleCount(products.length);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (direction === 'right') {
      loadAll();
    }
    if (!railRef.current) return;
    // Avanca ~5 cards no desktop, ~3 no tablet, ~2 no mobile
    const scrollAmount = railRef.current.clientWidth;
    railRef.current.scrollBy({
      left: direction === 'right' ? scrollAmount : -scrollAmount,
      behavior: 'smooth',
    });
  };

  const handleScroll = () => {
    if (visibleCount < products.length && railRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = railRef.current;
      // Quando faltarem ~350px para o final do trilho visível atual, carrega o restante
      if (scrollLeft + clientWidth >= scrollWidth - 350) {
        loadAll();
      }
    }
  };

  const handleFocusCapture = (e: React.FocusEvent) => {
    try {
      // Só expande se o foco for originado por navegação via teclado (:focus-visible)
      // Toque em celular ou clique de mouse NÃO disparam focus-visible e portanto não expandem o trilho
      if (e.target && (e.target as HTMLElement).matches(':focus-visible')) {
        loadAll();
      }
    } catch {
      // Fallback defensivo
    }
  };

  const visibleProducts = products.slice(0, visibleCount);

  return (
    <section className={`w-full ${isFirst ? 'pt-2 sm:pt-4' : ''}`}>
      {/* Linha divisória suave e tracejada na cor laranja entre os trilhos */}
      {!isFirst && (
        <div className="w-full my-8 sm:my-10">
          <div className="border-t border-dashed border-orange-500/50 w-full" />
        </div>
      )}

      {/* Cabecalho da Secao */}
      <div className="flex items-center justify-between mb-4 sm:mb-6 px-0">
        <h2 className="text-xl sm:text-2xl font-black text-[#0f172a] uppercase tracking-wider leading-tight">
          {title}
        </h2>
        <Link
          href={viewAllHref}
          scroll={true}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="text-sm sm:text-base font-semibold text-[#fe7302] hover:text-[#c85c00] hover:underline transition-colors flex items-center gap-1 shrink-0 ml-4"
        >
          Ver todos <span className="text-base leading-none">→</span>
        </Link>
      </div>

      {/* Container do Rail com setas desktop */}
      <div className="relative group/rail">
        {/* Seta Esquerda - desktop only */}
        <button
          onClick={() => scroll('left')}
          aria-label="Anterior"
          className="hidden md:flex absolute -left-5 top-[40%] -translate-y-1/2 z-20
                     w-9 h-9 items-center justify-center
                     bg-white border border-[#e2e8f0] shadow-md rounded-full
                     text-[#0f172a] hover:bg-[#fe7302] hover:text-white hover:border-[#fe7302]
                     transition-all duration-200 opacity-0 group-hover/rail:opacity-100"
        >
          <ChevronLeft size={18} />
        </button>

        {/* Trilho Horizontal com Scroll Fluido */}
        <div
          ref={railRef}
          onScroll={handleScroll}
          onFocusCapture={handleFocusCapture}
          className="flex gap-3 lg:gap-4 overflow-x-auto scroll-smooth pb-3
                     [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {visibleProducts.map((product, index) => (
            <div
              key={product.id}
              // Mobile: 44vw (~2.2 cards), md: ~31% (~3 cards), lg: calc 5 cards exact
              className="flex-shrink-0 w-[44vw] md:w-[31%] lg:w-[calc((100%-4*1rem)/5)]"
              style={{ scrollSnapAlign: 'start' }}
            >
              <ProductCard product={product} priority={isFirst && index < 3} />
            </div>
          ))}
        </div>

        {/* Seta Direita - desktop only */}
        <button
          onClick={() => scroll('right')}
          aria-label="Proximo"
          className="hidden md:flex absolute -right-5 top-[40%] -translate-y-1/2 z-20
                     w-9 h-9 items-center justify-center
                     bg-white border border-[#e2e8f0] shadow-md rounded-full
                     text-[#0f172a] hover:bg-[#fe7302] hover:text-white hover:border-[#fe7302]
                     transition-all duration-200 opacity-0 group-hover/rail:opacity-100"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </section>
  );
}
