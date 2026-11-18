'use client';

import { useRef, useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Layers } from 'lucide-react';
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

// Padronização rigorosa dos nomes visuais das categorias
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
  const hasImage = Boolean(imageUrl && imageUrl.trim() !== '');

  return (
    <button
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-xl sm:rounded-2xl transition-all duration-300
        w-full aspect-square
        group outline-none border
        ${isActive
          ? 'border-[#fe7302] ring-2 ring-[#fe7302] ring-offset-2 ring-offset-white shadow-md scale-[1.02]'
          : 'border-slate-200/80 hover:border-[#fe7302]/60 hover:shadow-md hover:scale-[1.02]'}
      `}
    >
      {/* Background Image */}
      <div className="absolute inset-0 bg-[#0f172a]">
        {hasImage && (
          <Image
            src={imageUrl}
            alt={`Categoria ${name}`}
            fill
            priority={priority}
            quality={80}
            sizes="(max-width: 640px) 110px, (max-width: 1024px) 140px, 180px"
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
          {formatCategoryDisplayName(tp(name))}
        </span>
      </div>
    </button>
  );
}

function CategoryCarouselContent({ initialCategories, selectedCategory }: CategoryCarouselProps) {
  const [categories, setCategories] = useState<Category[]>(initialCategories || []);
  const [showAll, setShowAll] = useState(false);
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

  if (categories.length === 0) return null;

  // Organiza: 6 categorias em destaque inicial
  const highlightedCategories: Category[] = [];
  const remainingCategories: Category[] = [];

  // Mapeia na ordem estrita solicitada: Interclasse, Carnaval, Cristã, Agro, Profissões e Corrida
  HIGHLIGHTED_SLUGS.forEach(slug => {
    const found = categories.find(c => {
      const norm = normalizeSearchTerm(c.name).replace(/-/g, ' ');
      return norm === slug || norm.startsWith(slug);
    });
    if (found && !highlightedCategories.some(h => h.id === found.id)) {
      highlightedCategories.push(found);
    }
  });

  // Demais categorias
  categories.forEach(c => {
    if (!highlightedCategories.some(h => h.id === c.id)) {
      remainingCategories.push(c);
    }
  });

  const handleCategoryClick = (catName: string) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (catName === t('allCategories')) {
      router.push('/');
    } else {
      router.push(`/?category=${encodeURIComponent(catName)}`);
    }
  };

  return (
    <section className="w-full pt-3 pb-4 sm:pt-4 sm:pb-6">
      {/* Cabeçalho da Seção de Categorias: linha própria no celular, lado a lado em telas maiores */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-3 sm:mb-4">
        <h2 className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-tight">
          Explore por categoria
        </h2>

        {remainingCategories.length > 0 && (
          <div className="flex items-center sm:justify-end">
            <button
              onClick={() => setShowAll(!showAll)}
              className="group inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-[#fe7302] hover:text-[#e56600] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#fe7302] rounded px-1.5 py-0.5 -ml-1.5 sm:ml-0"
              aria-expanded={showAll}
            >
              <span>{showAll ? 'Ver menos' : 'Ver todas'}</span>
              {!showAll && (
                <span className="whitespace-nowrap font-bold">({categories.length})</span>
              )}
              <span className="text-sm font-semibold leading-none group-hover:translate-x-0.5 transition-transform">
                {showAll ? '↑' : '→'}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Grid das 6 categorias principais: 3 colunas no mobile (2 linhas) e 6 no tablet/desktop (1 linha) */}
      <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-6 gap-2.5 sm:gap-3.5">
        {highlightedCategories.map((cat, index) => (
          <CategoryCard
            key={cat.id}
            name={cat.name}
            imageUrl={cat.imageUrl}
            priority={index < 6}
            isActive={normalizeSearchTerm(activeCategory) === normalizeSearchTerm(cat.name)}
            onClick={() => handleCategoryClick(cat.name)}
          />
        ))}
      </div>

      {/* Grid expansível com as demais categorias */}
      {showAll && remainingCategories.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-300">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
            Mais categorias
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5 sm:gap-3.5">
            {remainingCategories.map((cat) => (
              <CategoryCard
                key={cat.id}
                name={cat.name}
                imageUrl={cat.imageUrl}
                priority={false}
                isActive={normalizeSearchTerm(activeCategory) === normalizeSearchTerm(cat.name)}
                onClick={() => handleCategoryClick(cat.name)}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export default function CategoryCarousel({ initialCategories, selectedCategory }: CategoryCarouselProps) {
  return <CategoryCarouselContent initialCategories={initialCategories} selectedCategory={selectedCategory} />;
}
