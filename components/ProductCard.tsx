'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart } from 'lucide-react';
import { useGeo } from '@/lib/i18n/GeoContext';

export default function ProductCard({ product, priority = false }: { product: any; priority?: boolean }) {
  const [isFavorite, setIsFavorite] = useState(false);
  const { formatPrice, tp } = useGeo();

  const capaSrc = product?.urls?.capa || product?.urls?.destaque || '';
  const destaqueSrc = product?.urls?.destaque || '';
  // Só faz efeito se destaque existir e for diferente da capa
  const hasHoverImage = destaqueSrc && destaqueSrc !== capaSrc;

  useEffect(() => {
    const currentFavorites = JSON.parse(localStorage.getItem('camisavetor_favorites') || '[]');
    setIsFavorite(currentFavorites.some((item: any) => item.id === product.id));
  }, [product.id]);

  const toggleFavorite = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    const currentFavorites = JSON.parse(localStorage.getItem('camisavetor_favorites') || '[]');
    const isAlreadyFav = currentFavorites.some((item: any) => item.id === product.id);
    const newFavorites = isAlreadyFav
      ? currentFavorites.filter((item: any) => item.id !== product.id)
      : [...currentFavorites, product];
    localStorage.setItem('camisavetor_favorites', JSON.stringify(newFavorites));
    setIsFavorite(!isAlreadyFav);
    window.dispatchEvent(new Event('favorites-updated'));
  };

  return (
    <div className="relative group transition-all duration-500">
      <button onClick={toggleFavorite} className="absolute top-4 right-4 z-20 transition-all active:scale-75">
        <Heart size={20} className={isFavorite ? 'fill-[#fe7302] text-[#fe7302]' : 'text-gray-300'} />
      </button>

      <Link href={`/product/${product.slug || product.id}`} className="block">
        <div className="aspect-square relative overflow-hidden rounded-xl bg-[#f8f8f8] border border-transparent group-hover:border-[#0f172a] group-hover:bg-black mb-4 group-hover:shadow-xl group-hover:shadow-black/30 transition-all duration-300">

          {capaSrc ? (
            <>
              {/* Imagem CAPA — prioridade de carregamento para LCP nos primeiros cards */}
              <Image
                src={capaSrc}
                alt={product.name}
                fill
                priority={priority}
                // Breakpoints corretos: mobile é 1 coluna (100vw), md=3 colunas, lg=5 colunas
                sizes="(max-width: 767px) calc(100vw - 24px), (max-width: 1023px) calc(33vw - 24px), calc(20vw - 24px)"
                quality={85}
                className={`object-cover transition-transform duration-500 group-hover:scale-105 ${
                  hasHoverImage
                    ? 'group-hover:opacity-0'
                    : ''
                }`}
              />

              {/* Imagem DESTAQUE — carregada de forma lazy pois fica invisível até o hover */}
              {hasHoverImage && (
                <Image
                  src={destaqueSrc}
                  alt={`${product.name} — destaque`}
                  fill
                  sizes="(max-width: 767px) calc(100vw - 24px), (max-width: 1023px) calc(33vw - 24px), calc(20vw - 24px)"
                  quality={85}
                  loading="lazy"
                  className="object-contain transition-transform duration-500 opacity-0 scale-100 group-hover:opacity-100 group-hover:scale-105"
                />
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200">
              <span className="text-gray-400 text-xs">Sem Imagem</span>
            </div>
          )}
        </div>

        <div className="text-center px-2">
          <h3 className="text-[10px] font-medium text-gray-500 uppercase tracking-[0.12em] mb-1.5 truncate">
            {tp(product.name)}
          </h3>
          <span className="text-[15px] font-semibold text-[#333333] tracking-tight">
            {formatPrice(product.price)}
          </span>
        </div>
      </Link>
    </div>
  );
}