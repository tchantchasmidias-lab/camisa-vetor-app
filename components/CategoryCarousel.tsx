'use client';

import { useRef, useEffect, useState, Suspense } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { useGeo } from '@/lib/i18n/GeoContext';
import { normalizeSearchTerm } from '@/lib/stringUtils';
import { safeSessionStorage } from '@/lib/safeStorage';
import Image from 'next/image';

interface Category {
  id: string;
  name: string;
  imageUrl: string;
}

function CategoryCard({
  name,
  imageUrl,
  isActive,
  priority = false,
  onClick,
}: {
  name: string;
  imageUrl: string;
  isActive: boolean;
  priority?: boolean;
  onClick: () => void;
}) {
  const { tp } = useGeo();
  const hasImage = Boolean(imageUrl && imageUrl.trim() !== '');

  return (
    <button
      onClick={onClick}
      className={`
        flex-shrink-0 relative overflow-hidden rounded-2xl transition-all duration-300
        w-[145px] h-[82px] md:w-[185px] md:h-[100px]
        group outline-none
        ${isActive
          ? 'ring-2 ring-[#fe7302] ring-offset-2 ring-offset-white shadow-lg shadow-orange-200/40 scale-[1.03]'
          : 'hover:scale-[1.02] hover:shadow-xl'}
      `}
    >
      {/* Background */}
      <div className="absolute inset-0 bg-[#111]">
        {hasImage && (
          <Image
            src={imageUrl}
            alt={`Categoria ${name}`}
            fill
            priority={priority}
            quality={75}
            sizes="(max-width: 768px) 150px, 200px"
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
        )}
      </div>

      {/* Overlay escuro por padrão, some no hover/ativo (apenas para cards com imagem) */}
      {hasImage ? (
        <div
          className={`absolute inset-0 bg-black transition-opacity duration-300
            ${isActive ? 'opacity-0' : 'opacity-55 group-hover:opacity-0'}
          `}
        />
      ) : null}

      {/* Gradient base — sempre presente para legibilidade do texto */}
      <div className={`absolute inset-0 bg-gradient-to-t transition-opacity duration-300
        ${hasImage
          ? `from-black/80 via-black/20 to-transparent ${isActive ? 'opacity-70' : 'opacity-100 group-hover:opacity-60'}`
          : 'from-black/75 via-black/25 to-black/10 opacity-100'
        }`}
      />

      {/* Active ring glow */}
      {isActive && (
        <div className="absolute inset-0 bg-[#fe7302]/8 rounded-2xl" />
      )}

      {/* Category name */}
      <div className="absolute inset-0 flex items-center justify-center px-3">
        <span className="category-pill-label category-badge text-white font-bold text-[12.5px] tracking-[0.03em] uppercase text-center leading-tight drop-shadow-lg">
          {tp(name)}
        </span>
      </div>
    </button>
  );
}

function CategoryCarouselContent() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const { t } = useGeo();
  const activeCategory = (searchParams?.get ? searchParams.get('category') : null) || t('allCategories');

  useEffect(() => {
    // 1. Leitura rápida do cache da sessão para renderização instantânea (0ms)
    const cached = safeSessionStorage.getItem('cv_categories_cache');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCategories(parsed);
          setIsLoading(false);
        }
      } catch {}
    }

    const fetchCategories = async () => {
      try {
        const q = query(collection(db, 'categories'), orderBy('name', 'asc'));
        const snap = await getDocs(q);
        const list = snap.docs.map(d => ({
          id: d.id,
          name: d.data().name || '',
          imageUrl: d.data().imageUrl || '',
        }));
        list.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' }));
        setCategories(list);
        safeSessionStorage.setItem('cv_categories_cache', JSON.stringify(list));
      } catch (err) {
        console.error('Erro ao carregar categorias:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const scroll = (offset: number) => {
    scrollRef.current?.scrollBy({ left: offset, behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <section className="w-full py-3">
        <div className="flex gap-3 overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex-shrink-0 w-[145px] h-[82px] md:w-[185px] md:h-[100px] bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (categories.length === 0) return null;

  return (
    <section className="w-full select-none overflow-hidden py-1 animate-in fade-in duration-700">
      <div className="relative group/carousel pl-0 md:pl-0">

        {/* Left arrow */}
        <button
          onClick={() => scroll(-600)}
          aria-label="Scroll esquerda"
          className="hidden md:flex items-center justify-center absolute left-2 top-1/2 -translate-y-1/2 z-20
            w-9 h-9 bg-white shadow-xl rounded-full border border-gray-100 text-gray-700
            opacity-0 group-hover/carousel:opacity-100 hover:bg-[#fe7302] hover:text-white hover:scale-110
            transition-all duration-200"
        >
          <ChevronLeft size={20} />
        </button>

        {/* Right arrow */}
        <button
          onClick={() => scroll(600)}
          aria-label="Scroll direita"
          className="hidden md:flex items-center justify-center absolute right-2 top-1/2 -translate-y-1/2 z-20
            w-9 h-9 bg-white shadow-xl rounded-full border border-gray-100 text-gray-700
            opacity-0 group-hover/carousel:opacity-100 hover:bg-[#fe7302] hover:text-white hover:scale-110
            transition-all duration-200"
        >
          <ChevronRight size={20} />
        </button>

        {/* Scrollable row */}
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scroll-smooth no-scrollbar px-1 py-2"
        >
          {categories.map((cat, index) => (
            <CategoryCard
              key={cat.id}
              name={cat.name}
              imageUrl={cat.imageUrl}
              priority={index < 6}
              isActive={normalizeSearchTerm(activeCategory) === normalizeSearchTerm(cat.name)}
              onClick={() =>
                cat.name === t('allCategories')
                  ? router.push('/')
                  : router.push(`/?category=${encodeURIComponent(cat.name)}`)
              }
            />
          ))}
        </div>
      </div>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none !important; }
        .no-scrollbar { -ms-overflow-style: none !important; scrollbar-width: none !important; }
      `}</style>
    </section>
  );
}

export default function CategoryCarousel() {
  return (
    <Suspense fallback={<div className="h-[110px]" />}>
      <CategoryCarouselContent />
    </Suspense>
  );
}