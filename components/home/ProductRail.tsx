'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import type { Product } from '@/components/HomeClient';

interface ProductRailProps {
  title: string;
  products: Product[];
  viewAllHref: string;
}

export default function ProductRail({ title, products, viewAllHref }: ProductRailProps) {
  const railRef = useRef<HTMLDivElement>(null);

  if (!products || products.length === 0) return null;

  const scroll = (direction: 'left' | 'right') => {
    if (!railRef.current) return;
    const scrollAmount = railRef.current.clientWidth * 0.75;
    railRef.current.scrollBy({
      left: direction === 'right' ? scrollAmount : -scrollAmount,
      behavior: 'smooth',
    });
  };

  return (
    <section className="w-full mt-8 first:mt-0">
      {/* Cabecalho da Secao */}
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-[15px] md:text-[17px] font-bold text-[#0f172a] uppercase tracking-wider">
          {title}
        </h2>
        <Link
          href={viewAllHref}
          className="text-[12px] md:text-[13px] font-semibold text-[#fe7302] hover:text-[#c85c00] transition-colors flex items-center gap-0.5"
        >
          Ver todos <span className="text-[15px] leading-none">→</span>
        </Link>
      </div>

      {/* Container do Rail com setas desktop */}
      <div className="relative group/rail">
        {/* Seta Esquerda - desktop only */}
        <button
          onClick={() => scroll('left')}
          aria-label="Anterior"
          className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-20
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
          className="flex gap-3 md:gap-4 overflow-x-auto scroll-smooth pb-3
                     [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {products.map((product, index) => (
            <div
              key={product.id}
              className="flex-shrink-0 w-[155px] md:w-[195px]"
              style={{ scrollSnapAlign: 'start' }}
            >
              <ProductCard product={product} priority={index < 3} />
            </div>
          ))}
        </div>

        {/* Seta Direita - desktop only */}
        <button
          onClick={() => scroll('right')}
          aria-label="Proximo"
          className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-20
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
