'use client';

import { useState, useEffect, Suspense } from 'react';
import ProductCard from '@/components/ProductCard';
import { Heart, ArrowLeft, Ghost } from 'lucide-react';
import Link from 'next/link';
import { useGeo } from '@/lib/i18n/GeoContext';
import { safeLocalStorage } from '@/lib/safeStorage';

function FavoritosContent() {
  const [favorites, setFavorites] = useState<any[]>([]);
  const { t } = useGeo();

  // Carrega os favoritos reais do localStorage ao abrir a página
  useEffect(() => {
    const loadFavorites = () => {
      try {
        const raw = safeLocalStorage.getItem('camisavetor_favorites');
        setFavorites(raw ? JSON.parse(raw) : []);
      } catch {
        setFavorites([]);
      }
    };

    loadFavorites();
    // Ouve se algum item foi removido enquanto a página está aberta
    window.addEventListener('favorites-updated', loadFavorites);
    return () => window.removeEventListener('favorites-updated', loadFavorites);
  }, []);

  return (
    <div className="bg-white min-h-screen animate-in fade-in duration-500">
      <main className="pt-8 md:pt-12 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
         
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-gray-50 pb-10">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Heart size={16} className="text-[#fe7302] fill-[#fe7302]" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#fe7302]">{t('wishlist')}</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-gray-900">
                {t('myFavoritesTitle')} <span className="text-[#fe7302]">{t('myFavoritesTitleHighlight')}</span>
              </h1>
            </div>
           
            <Link href="/" className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-[#fe7302] transition-colors">
              <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
              {t('exploreMoreVectors')}
            </Link>
          </div>

          {favorites.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-10">
              {favorites.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-32 text-center animate-in zoom-in duration-700">
              <div className="relative mb-8">
                <Heart size={80} className="text-gray-50 stroke-[1px]" />
                <Ghost size={40} className="absolute -bottom-2 -right-2 text-gray-200 animate-bounce" />
              </div>
              <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-800 mb-2">{t('emptyFavoritesTitle')}</h2>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.1em] mb-10 max-w-[250px] leading-relaxed opacity-70">
                {t('emptyFavoritesDesc')}
              </p>
              <Link href="/" className="bg-black text-white px-10 py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-[#fe7302] transition-all shadow-xl shadow-gray-200">
                {t('backToShowcase')}
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function FavoritosPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-white"><div className="w-8 h-8 border-2 border-[#fe7302] border-t-transparent rounded-full animate-spin"></div></div>}>
      <FavoritosContent />
    </Suspense>
  );
}