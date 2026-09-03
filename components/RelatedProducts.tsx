'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, limit } from 'firebase/firestore';
import Link from 'next/link';
import Image from 'next/image';
import { useGeo } from '@/lib/i18n/GeoContext';
import { formatTitleCase } from '@/lib/stringUtils';

interface RelatedProduct {
  id: string;
  name: string;
  price: number;
  isFree?: boolean;
  slug?: string;
  urls: { capa?: string; destaque?: string };
}

interface RelatedProductsProps {
  category: string;
  currentProductId: string;
}

export default function RelatedProducts({ category, currentProductId }: RelatedProductsProps) {
  const [products, setProducts] = useState<RelatedProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { tp, formatPrice } = useGeo();

  useEffect(() => {
    if (!category) return;
    const fetchRelated = async () => {
      try {
        // Sem orderBy para evitar exigência de índice composto no Firestore
        const q = query(
          collection(db, 'products'),
          where('category', '==', category),
          limit(6)
        );
        const snap = await getDocs(q);
        const items = snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as RelatedProduct))
          .filter((p) => p.id !== currentProductId)
          .slice(0, 4);
        setProducts(items);
      } catch (e) {
        console.error('Erro ao carregar produtos relacionados:', e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRelated();
  }, [category, currentProductId]);

  if (isLoading || products.length === 0) return null;

  return (
    <section className="mt-14 pt-10 border-t border-[#f1f3f4]">
      {/* Heading */}
      <h2 className="text-[11px] font-bold text-[#999] uppercase tracking-[0.2em] mb-6">
        ✨ Você Também Pode Gostar
      </h2>

      {/* Grid 4 colunas — 2 no mobile */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {products.map((product) => {
          const imgSrc = product.urls?.capa || product.urls?.destaque || '';
          const href = `/product/${product.slug || product.id}`;

          return (
            <Link
              key={product.id}
              href={href}
              className="group block"
              aria-label={`Ver ${tp(product.name)}`}
            >
              {/* Card imagem — lazy load */}
              <div className="aspect-square relative rounded-xl overflow-hidden bg-[#f8f9fa] border border-transparent group-hover:border-[#0f172a] group-hover:bg-black transition-all duration-300 group-hover:shadow-xl group-hover:shadow-black/20 mb-3">
                {imgSrc ? (
                  <Image
                    src={imgSrc}
                    alt={`Arte em vetor para camiseta ${tp(product.name)} - CDR, PDF, SVG, PNG`}
                    fill
                    sizes="(max-width: 640px) 45vw, 25vw"
                    quality={75}
                    loading="lazy"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-gray-300 text-xs">Sem imagem</span>
                  </div>
                )}
              </div>

              {/* Título */}
              <h3 className="text-[11px] font-medium text-gray-700 product-title tracking-normal mb-1 truncate text-center px-1">
                {formatTitleCase(tp(product.name))}
              </h3>

              {/* Preço */}
              {(() => {
                const isFree = Boolean(product?.isFree) || Number(product?.price) === 0;
                return (
                  <p className={`text-[14px] font-semibold tracking-tight text-center ${isFree ? 'text-[#16a34a]' : 'text-[#333333]'}`}>
                    {isFree ? 'GRÁTIS' : formatPrice(product.price || 0)}
                  </p>
                );
              })()}
            </Link>
          );
        })}
      </div>
    </section>
  );
}