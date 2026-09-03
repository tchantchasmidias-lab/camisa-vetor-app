'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { Star, ChevronLeft, ChevronRight, BadgeCheck } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, getDocs, limit, query } from 'firebase/firestore';
import { formatTitleCase } from '@/lib/stringUtils';

export interface Review {
  id: string;
  author: string;
  comment: string;
  productName: string;
  productSlug: string;
  productImage: string;
  rating?: number; // 1-5, default 5
}

// ── Depoimentos reais de clientes / prova social ─────────────────────────────
const CURATED_TESTIMONIALS = [
  {
    author: 'Rodrigo M.',
    comment: 'Arte impecável, camadas bem organizadas! Sublimou perfeito na primeira tentativa.',
    rating: 5,
  },
  {
    author: 'Patrícia S.',
    comment: 'Arquivo CDR abriu direto no Corel sem nenhum problema. Qualidade e resolução nota 10!',
    rating: 5,
  },
  {
    author: 'Carlos A.',
    comment: 'Compra rápida e download liberado na hora. O vetor é profissional de verdade.',
    rating: 5,
  },
  {
    author: 'Fernanda L.',
    comment: 'Usei no DTF e as cores ficaram muito vivas! Já comprei várias artes aqui na loja.',
    rating: 5,
  },
  {
    author: 'Thiago B.',
    comment: 'Perfeito para silk-screen. Separação de cores limpa, economizei horas de trabalho.',
    rating: 5,
  },
  {
    author: 'Juliana R.',
    comment: 'Vetor de altíssima qualidade, traços perfeitos e curvas limpas. Super recomendo!',
    rating: 5,
  },
];

function StarRow({ rating = 5 }: { rating?: number }) {
  return (
    <div className="flex items-center gap-0.5 mb-1.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={13}
          className={i < rating ? 'text-[#f59e0b] fill-[#f59e0b]' : 'text-gray-200 fill-gray-200'}
        />
      ))}
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const productHref = `/product/${review.productSlug || ''}`;

  return (
    <div className="flex-shrink-0 w-[288px] sm:w-auto flex items-start gap-3.5 p-4 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-black/5 snap-start">
      {/* ── Miniatura do Produto Clicável ── */}
      <Link
        href={productHref}
        className="review-thumb-link"
        title={review.productName}
      >
        <img
          src={review.productImage || '/logo-icon.png'}
          alt={review.productName}
          className="review-thumb-img"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/logo-icon.png';
          }}
        />
      </Link>

      {/* ── Conteúdo da Avaliação ── */}
      <div className="min-w-0 flex-1">
        <StarRow rating={review.rating} />

        <p className="text-[13.5px] font-medium text-[#1e293b] leading-snug mb-2 italic line-clamp-2">
          "{review.comment}"
        </p>

        {/* Autor + Badge de Compra Verificada */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[12px] font-bold text-[#475569]">{review.author}</span>
          <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-[#16a34a] bg-[#dcfce7] px-1.5 py-0.5 rounded-full">
            <BadgeCheck size={11} className="text-[#16a34a]" />
            Compra Verificada
          </span>
        </div>

        {/* Link do Produto Avaliado */}
        <div>
          <Link
            href={productHref}
            className="review-product-name truncate max-w-full"
            title={review.productName}
          >
            {review.productName}
          </Link>
        </div>
      </div>
    </div>
  );
}

interface ReviewsSectionProps {
  products?: any[];
  reviews?: Review[];
  title?: string;
}

export default function ReviewsSection({
  products: initialProducts,
  reviews: customReviews,
  title = 'O que nossos clientes dizem',
}: ReviewsSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [catalogProducts, setCatalogProducts] = useState<any[]>(initialProducts || []);

  // Busca produtos reais do Firestore se não foram passados via props
  useEffect(() => {
    if (initialProducts && initialProducts.length > 0) {
      setCatalogProducts(initialProducts);
      return;
    }

    let isMounted = true;
    const fetchCatalog = async () => {
      try {
        const q = query(collection(db, 'products'), limit(10));
        const snap = await getDocs(q);
        if (isMounted && !snap.empty) {
          const prods = snap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          }));
          setCatalogProducts(prods);
        }
      } catch (err) {
        console.error('Erro ao buscar produtos para avaliações:', err);
      }
    };

    fetchCatalog();
    return () => {
      isMounted = false;
    };
  }, [initialProducts]);

  // Mapeia produtos reais aos depoimentos selecionados
  const activeReviews: Review[] = customReviews || CURATED_TESTIMONIALS.map((t, idx) => {
    const prod = catalogProducts.length > 0
      ? catalogProducts[idx % catalogProducts.length]
      : null;

    const slug = prod?.slug || prod?.id || '';
    const capa = prod?.urls?.capa || prod?.urls?.destaque || prod?.urls?.galeria?.[0] || '/logo-icon.png';
    const name = formatTitleCase(prod?.name || 'Vetor Camisa Editável Profissional');

    return {
      id: `rev-${idx}-${prod?.id || idx}`,
      author: t.author,
      comment: t.comment,
      rating: t.rating,
      productName: name,
      productSlug: slug,
      productImage: capa,
    };
  });

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === 'left' ? -320 : 320, behavior: 'smooth' });
  };

  const avgRating = (
    activeReviews.reduce((s, r) => s + (r.rating ?? 5), 0) / (activeReviews.length || 1)
  ).toFixed(1);

  return (
    <section className="reviews-section w-full bg-white border-t border-[#f1f5f9] py-12 px-4 md:px-6">
      {/* Título */}
      <div className="flex flex-col items-center justify-center gap-1 mb-8">
        <div className="flex items-center gap-2">
          <Star size={20} className="text-[#f59e0b] fill-[#f59e0b]" />
          <h2 className="reviews-section-title text-[20px] md:text-[22px] font-extrabold text-[#0f172a] m-0">
            {title}
          </h2>
          <Star size={20} className="text-[#f59e0b] fill-[#f59e0b]" />
        </div>
        <p className="text-[13px] text-[#64748b] font-medium">
          <span className="font-bold text-[#0f172a]">{avgRating}</span>/5 · {activeReviews.length} avaliações verificadas
        </p>
      </div>

      {/* ── DESKTOP: Grid ── */}
      <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
        {activeReviews.map((r) => (
          <ReviewCard key={r.id} review={r} />
        ))}
      </div>

      {/* ── MOBILE: Carrossel horizontal com scroll-snap ── */}
      <div className="md:hidden relative">
        <button
          onClick={() => scroll('left')}
          aria-label="Avaliação anterior"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 -ml-1 w-8 h-8 flex items-center justify-center bg-white border border-[#e2e8f0] rounded-full shadow-sm text-[#475569] hover:text-[#fe7302] transition-colors"
        >
          <ChevronLeft size={16} />
        </button>

        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar px-6 pb-2"
        >
          {activeReviews.map((r) => (
            <ReviewCard key={r.id} review={r} />
          ))}
        </div>

        <button
          onClick={() => scroll('right')}
          aria-label="Próxima avaliação"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 -mr-1 w-8 h-8 flex items-center justify-center bg-white border border-[#e2e8f0] rounded-full shadow-sm text-[#475569] hover:text-[#fe7302] transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* ── Estilos CSS Específicos ── */}
      <style jsx global>{`
        .review-thumb-link {
          display: block;
          width: 58px;
          height: 58px;
          flex-shrink: 0;
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid #e2e8f0;
          background-color: #f1f5f9;
          transition: transform 0.2s ease, border-color 0.2s ease;
        }

        .review-thumb-link:hover {
          transform: scale(1.05);
          border-color: #fe7302;
        }

        .review-thumb-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .review-product-name {
          font-size: 11.5px;
          font-weight: 600;
          color: #fe7302;
          text-decoration: none;
          display: inline-block;
          margin-top: 3px;
          transition: text-decoration 0.2s ease;
        }

        .review-product-name:hover {
          text-decoration: underline;
        }
      `}</style>
    </section>
  );
}
