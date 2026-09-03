'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Shirt, ArrowRight } from 'lucide-react';
import { formatTitleCase } from '@/lib/stringUtils';
import { useGeo } from '@/lib/i18n/GeoContext';

export interface BlogProductItem {
  id: string;
  name: string;
  slug?: string;
  price: number;
  isFree?: boolean;
  image: string;
}

interface BlogProductSidebarProps {
  products: BlogProductItem[];
}

export default function BlogProductSidebar({ products }: BlogProductSidebarProps) {
  const { tp, formatPrice } = useGeo();

  if (!products || products.length === 0) return null;

  return (
    <div className="bg-[#111111] border border-white/10 rounded-3xl p-6 shadow-2xl text-white">
      {/* CABEÇALHO DA LATERAL */}
      <div className="flex items-center gap-2.5 pb-4 mb-5 border-b border-white/10">
        <Shirt size={18} className="text-[#fe7302]" />
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white">
          Artes em Destaque
        </h3>
      </div>

      {/* LISTA VERTICAL DE PRODUTOS */}
      <div className="space-y-3">
        {products.slice(0, 5).map((product) => {
          const isFree = Boolean(product.isFree) || Number(product.price) === 0;
          const href = `/product/${product.slug || product.id}`;
          const formattedTitle = formatTitleCase(tp(product.name) || product.name);

          return (
            <Link
              key={product.id}
              href={href}
              className="group flex items-center gap-3.5 p-2.5 rounded-2xl hover:bg-white/5 transition-all duration-200 border border-transparent hover:border-white/10"
              title={formattedTitle}
            >
              {/* Miniatura quadrada 1:1 */}
              <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-black/40 border border-white/10">
                {product.image ? (
                  <Image
                    src={product.image}
                    alt={`Arte em vetor ${formattedTitle}`}
                    fill
                    sizes="64px"
                    loading="lazy"
                    quality={75}
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-white/5">
                    <span className="text-[#fe7302] font-black text-xs">CV</span>
                  </div>
                )}
              </div>

              {/* Detalhes do Produto */}
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-gray-200 group-hover:text-[#fe7302] transition-colors leading-snug line-clamp-2 mb-1.5">
                  {formattedTitle}
                </h4>
                <p className={`text-xs font-black tracking-tight ${isFree ? 'text-[#10b981]' : 'text-[#fe7302]'}`}>
                  {isFree ? 'GRÁTIS' : formatPrice(product.price || 0)}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* BOTÃO VER TODOS OS VETORES */}
      <div className="mt-6 pt-4 border-t border-white/10">
        <Link
          href="/"
          className="flex items-center justify-center gap-2 w-full py-3 bg-black border border-white/15 rounded-xl text-[11px] font-bold uppercase tracking-wider text-white hover:border-[#fe7302] hover:text-[#fe7302] transition-all shadow-sm group"
        >
          Ver Todos os Vetores
          <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform text-[#fe7302]" />
        </Link>
      </div>
    </div>
  );
}
