'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import type { Product } from '@/components/HomeClient';

interface ProductRailProps {
  id?: string;
  title: string;
  products: Product[];
  viewAllHref: string;
  isFirst?: boolean;
  deferImages?: boolean;
  cardsPerRowDesktop?: 4 | 5;
}

// Larguras dos cards:
//   Mobile  (~390px viewport): w-[44vw]  => ~2.2 cards visíveis (indica continuacao)
//   Tablet  (md ~768px)      : w-[31%]   => 3 cards visíveis com gap-3
//   Desktop (lg ~1024px+)    : w-[calc((100%-4*1rem)/5)] => exatos 5 cards com gap-4

const INITIAL_VISIBLE_COUNT = 8;

export default function ProductRail({
  id,
  title,
  products,
  viewAllHref,
  isFirst = false,
  deferImages = false,
  cardsPerRowDesktop = 5,
}: ProductRailProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);
  const [shouldLoadImages, setShouldLoadImages] = useState(!deferImages);

  useEffect(() => {
    if (!deferImages || shouldLoadImages) return;

    if (typeof IntersectionObserver === 'undefined') {
      setShouldLoadImages(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setShouldLoadImages(true);
          observer.disconnect();
        }
      },
      { rootMargin: '450px 0px' }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [deferImages, shouldLoadImages]);

  if (!products || products.length === 0) return null;

  const loadAll = () => {
    if (!shouldLoadImages) {
      setShouldLoadImages(true);
    }
    if (visibleCount < products.length) {
      setVisibleCount(products.length);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (!shouldLoadImages) {
      setShouldLoadImages(true);
    }
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
    if (!shouldLoadImages) {
      setShouldLoadImages(true);
    }
    if (visibleCount < products.length && railRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = railRef.current;
      // Quando faltarem ~350px para o final do trilho visível atual, carrega o restante
      if (scrollLeft + clientWidth >= scrollWidth - 350) {
        loadAll();
      }
    }
  };

  const handleFocusCapture = (e: React.FocusEvent) => {
    if (!shouldLoadImages) {
      setShouldLoadImages(true);
    }
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

  const cardWidthClass = cardsPerRowDesktop === 4
    ? "flex-shrink-0 w-[calc(50%-0.375rem)] md:w-[31%] lg:w-[calc((100%-3*1rem)/4)]"
    : "flex-shrink-0 w-[44vw] md:w-[31%] lg:w-[calc((100%-4*1rem)/5)]";

  return (
    <section id={id} ref={sectionRef} className={`w-full ${isFirst ? 'pt-2 sm:pt-4' : ''}`}>
      {/* Linha divisória suave e tracejada na cor laranja entre os trilhos */}
      {!isFirst && (
        <div className="w-full my-8 sm:my-10">
          <div className="border-t border-dashed border-orange-500/50 w-full" />
        </div>
      )}

      {/* Cabecalho da Secao */}
      <div className="flex items-center justify-between mb-3.5 sm:mb-5 px-0">
        <h2 className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-tight">
          {title}
        </h2>
        <Link
          href={viewAllHref}
          scroll={true}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="text-xs sm:text-sm font-semibold text-[#fe7302] hover:text-[#c85c00] hover:underline transition-colors flex items-center gap-1 shrink-0 ml-4"
        >
          Ver todas <span className="text-sm leading-none">→</span>
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
              className={cardWidthClass}
              style={{ scrollSnapAlign: 'start' }}
            >
              <ProductCard
                product={product}
                priority={isFirst && index < 2}
                deferImage={!shouldLoadImages}
                imagePadding="p-[2px] sm:p-1"
              />
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
