'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { useGeo } from '@/lib/i18n/GeoContext';
import { normalizeSearchTerm, formatTitleCase } from '@/lib/stringUtils';
import { safeSessionStorage } from '@/lib/safeStorage';
import Image from 'next/image';

export interface Category {
  id: string;
  name: string;
  imageUrl: string;
}

export interface CategoryCarouselProps {
  initialCategories?: Category[];
  selectedCategory?: string;
}

const HIGHLIGHTED_SLUGS = ['interclasse', 'carnaval', 'crista', 'agro', 'profissao', 'corrida'];

// Padronização dos nomes visuais das categorias
const CATEGORY_DISPLAY_NAMES: Record<string, string> = {
  interclasse: 'Interclasse',
  carnaval: 'Carnaval',
  crista: 'Cristã',
  cristas: 'Cristã',
  agro: 'Agro',
  profissao: 'Profissões',
  profissoes: 'Profissões',
  'profissao e trabalho': 'Profissões',
  'profissoes e trabalho': 'Profissões',
  corrida: 'Corrida',
};

function formatCategoryDisplayName(rawName: string): string {
  const norm = normalizeSearchTerm(rawName).replace(/-/g, ' ');
  if (CATEGORY_DISPLAY_NAMES[norm]) {
    return CATEGORY_DISPLAY_NAMES[norm];
  }
  return formatTitleCase(rawName);
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
  const displayName = formatCategoryDisplayName(tp(name));
  const hasImage = Boolean(imageUrl && imageUrl.trim() !== '');

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Ver estampas da categoria ${displayName}`}
      className={`
        relative overflow-hidden rounded-xl sm:rounded-2xl transition-all duration-300
        w-full aspect-square
        group border text-left
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fe7302] focus-visible:ring-offset-2
        ${isActive
          ? 'border-[#fe7302] ring-2 ring-[#fe7302] ring-offset-2 ring-offset-white shadow-md scale-[1.02]'
          : 'border-slate-200/80 hover:border-[#fe7302]/60 hover:shadow-md hover:scale-[1.02]'}
      `}
    >
      {/* Background Image com proporção 1:1 reservada */}
      <div className="absolute inset-0 bg-[#0f172a]">
        {hasImage && (
          <Image
            src={imageUrl}
            alt={`Categoria ${displayName}`}
            fill
            sizes="(max-width: 640px) 160px, (max-width: 1024px) 200px, 240px"
            quality={80}
            priority={priority}
            loading={priority ? 'eager' : 'lazy'}
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
        )}
      </div>

      {/* Overlays para contraste de texto */}
      <div
        className={`absolute inset-0 bg-black transition-opacity duration-300
          ${isActive ? 'opacity-25' : 'opacity-40 group-hover:opacity-20'}
        `}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

      {/* Category Name */}
      <div className="absolute inset-x-0 bottom-0 pb-2 sm:pb-3 px-1.5 flex items-center justify-center text-center">
        <span className="text-white font-extrabold text-[11px] sm:text-[12.5px] lg:text-[13.5px] tracking-wide leading-tight drop-shadow-md group-hover:text-orange-200 transition-colors">
          {displayName}
        </span>
      </div>
    </button>
  );
}

function CategoryCarouselContent({ initialCategories, selectedCategory }: CategoryCarouselProps) {
  const [categories, setCategories] = useState<Category[]>(initialCategories || []);
  const [showAll, setShowAll] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const railRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { t } = useGeo();

  const activeCategory = selectedCategory || t('allCategories');

  useEffect(() => {
    if (categories.length > 0) {
      safeSessionStorage.setItem('cv_categories_cache', JSON.stringify(categories));
      return;
    }

    const cached = safeSessionStorage.getItem('cv_categories_cache');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCategories(parsed);
          return;
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
      }
    };
    fetchCategories();
  }, [categories.length]);

  // Organiza: 6 categorias em destaque inicial seguidas pelas demais em ordem estável
  const highlightedCategories: Category[] = [];
  const remainingCategories: Category[] = [];

  HIGHLIGHTED_SLUGS.forEach(slug => {
    const found = categories.find(c => {
      const norm = normalizeSearchTerm(c.name).replace(/-/g, ' ');
      return norm === slug || norm.startsWith(slug);
    });
    if (found && !highlightedCategories.some(h => h.id === found.id)) {
      highlightedCategories.push(found);
    }
  });

  categories.forEach(c => {
    if (!highlightedCategories.some(h => h.id === c.id)) {
      remainingCategories.push(c);
    }
  });

  // Lista consolidada com todas as categorias preservando a ordem atual
  const allOrderedCategories = [...highlightedCategories, ...remainingCategories];

  const updateScrollButtons = useCallback(() => {
    if (!railRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = railRef.current;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4);
  }, []);

  useEffect(() => {
    if (showAll) return;
    updateScrollButtons();
    const rail = railRef.current;
    if (!rail) return;

    rail.addEventListener('scroll', updateScrollButtons, { passive: true });
    window.addEventListener('resize', updateScrollButtons, { passive: true });

    const timer = setTimeout(updateScrollButtons, 150);

    return () => {
      rail.removeEventListener('scroll', updateScrollButtons);
      window.removeEventListener('resize', updateScrollButtons);
      clearTimeout(timer);
    };
  }, [allOrderedCategories.length, showAll, updateScrollButtons]);

  const scroll = (direction: 'left' | 'right') => {
    if (!railRef.current) return;
    const container = railRef.current;
    const cardWidth = container.firstElementChild?.clientWidth || 200;
    // Avança a largura útil visível mantendo continuidade
    const scrollAmount = Math.max(cardWidth * 2, container.clientWidth - cardWidth);
    container.scrollBy({
      left: direction === 'right' ? scrollAmount : -scrollAmount,
      behavior: 'smooth',
    });
  };

  const handleCategoryClick = (catName: string) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (catName === t('allCategories')) {
      router.push('/');
    } else {
      router.push(`/?category=${encodeURIComponent(catName)}`);
    }
  };

  if (allOrderedCategories.length === 0) return null;

  return (
    <section className="w-full pt-3 pb-4 sm:pt-4 sm:pb-6">
      {/* Cabeçalho da Seção de Categorias: lado a lado com 'Ver todas' */}
      <div className="flex items-center justify-between gap-4 mb-3 sm:mb-4">
        <h2 className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-tight">
          Explore por categoria
        </h2>

        {allOrderedCategories.length > 0 && (
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => setShowAll(!showAll)}
              className="group inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#fe7302] hover:text-[#e56600] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fe7302] rounded px-1.5 py-0.5"
              aria-expanded={showAll}
            >
              <span>{showAll ? 'Ver menos' : 'Ver todas'}</span>
              {!showAll && (
                <span className="whitespace-nowrap font-bold">({allOrderedCategories.length})</span>
              )}
              <span className="text-sm font-semibold leading-none group-hover:translate-x-0.5 transition-transform">
                {showAll ? '↑' : '→'}
              </span>
            </button>
          </div>
        )}
      </div>

      {!showAll ? (
        /* Modo Carrossel: Única linha horizontal com 6 cards no desktop, 2+fração no mobile, scroll-snap e setas */
        <div className="relative group/rail">
          {/* Seta Anterior (Desktop/Tablet) */}
          <button
            type="button"
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            aria-label="Categorias anteriores"
            className={`hidden md:flex absolute -left-3 sm:-left-4 lg:-left-5 top-1/2 -translate-y-1/2 z-20
              w-9 h-9 items-center justify-center
              bg-white border border-[#e2e8f0] shadow-md rounded-full text-[#0f172a]
              transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fe7302]
              ${!canScrollLeft
                ? 'opacity-20 cursor-not-allowed pointer-events-none'
                : 'opacity-70 group-hover/rail:opacity-100 hover:!opacity-100 hover:bg-[#fe7302] hover:text-white hover:border-[#fe7302] focus-visible:opacity-100'}`}
          >
            <ChevronLeft size={18} />
          </button>

          {/* Trilho Horizontal com Scroll Fluido e Snap. touch-action: auto para rolagem horizontal e vertical nativas */}
          <div
            ref={railRef}
            onFocusCapture={(e) => {
              (e.target as HTMLElement)?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
            }}
            className="flex gap-2.5 sm:gap-3 lg:gap-3.5 overflow-x-auto overflow-y-hidden scroll-smooth touch-auto
                       no-scrollbar [scrollbar-width:none] [&::-webkit-scrollbar]:hidden w-full max-w-full pb-2 pt-1"
            style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch', touchAction: 'auto' }}
          >
            {allOrderedCategories.map((cat, index) => (
              <div
                key={cat.id}
                className="flex-shrink-0 w-[calc((100%-2*0.625rem)/2.35)] sm:w-[calc((100%-3*0.75rem)/4)] md:w-[calc((100%-4*0.75rem)/5)] lg:w-[calc((100%-5*0.875rem)/6)]"
                style={{ scrollSnapAlign: 'start' }}
              >
                <CategoryCard
                  name={cat.name}
                  imageUrl={cat.imageUrl}
                  priority={index < 6}
                  isActive={normalizeSearchTerm(activeCategory) === normalizeSearchTerm(cat.name)}
                  onClick={() => handleCategoryClick(cat.name)}
                />
              </div>
            ))}
          </div>

          {/* Seta Próximo (Desktop/Tablet) */}
          <button
            type="button"
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            aria-label="Próximas categorias"
            className={`hidden md:flex absolute -right-3 sm:-right-4 lg:-right-5 top-1/2 -translate-y-1/2 z-20
              w-9 h-9 items-center justify-center
              bg-white border border-[#e2e8f0] shadow-md rounded-full text-[#0f172a]
              transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fe7302]
              ${!canScrollRight
                ? 'opacity-20 cursor-not-allowed pointer-events-none'
                : 'opacity-70 group-hover/rail:opacity-100 hover:!opacity-100 hover:bg-[#fe7302] hover:text-white hover:border-[#fe7302] focus-visible:opacity-100'}`}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      ) : (
        /* Modo Grade Expandida: Todas as categorias exibidas em grade completa */
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2.5 sm:gap-3 lg:gap-3.5 animate-in fade-in duration-300">
          {allOrderedCategories.map((cat, index) => (
            <div key={cat.id} className="w-full">
              <CategoryCard
                name={cat.name}
                imageUrl={cat.imageUrl}
                priority={index < 6}
                isActive={normalizeSearchTerm(activeCategory) === normalizeSearchTerm(cat.name)}
                onClick={() => handleCategoryClick(cat.name)}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default function CategoryCarousel({ initialCategories, selectedCategory }: CategoryCarouselProps) {
  return <CategoryCarouselContent initialCategories={initialCategories} selectedCategory={selectedCategory} />;
}
