'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart } from 'lucide-react';
import { useGeo } from '@/lib/i18n/GeoContext';

export default function ProductCard({ product }: any) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [imgSrc, setImgSrc] = useState(product?.urls?.capa || product?.urls?.destaque || '');
  const { formatPrice, tp } = useGeo();

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
        <div className="aspect-[4/5] relative overflow-hidden rounded-[1.5rem] bg-[#f8f8f8] mb-4 group-hover:shadow-xl group-hover:shadow-gray-100 transition-all duration-500">
          {imgSrc ? (
            <Image src={imgSrc} alt={product.name} fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200">
               <span className="text-gray-400 text-xs">Sem Imagem</span>
            </div>
          )}
        </div>

        <div className="text-center px-2">
          {/* Fonte Medium e Tracking wide para elegância */}
          <h3 className="text-[10px] font-medium text-gray-500 uppercase tracking-[0.12em] mb-1.5 truncate">
            {tp(product.name)}
          </h3>
          {/* Preço Semibold para destaque suave */}
          <span className="text-[15px] font-semibold text-[#333333] tracking-tight">
            {formatPrice(product.price)}
          </span>
        </div>
      </Link>
    </div>
  );
}