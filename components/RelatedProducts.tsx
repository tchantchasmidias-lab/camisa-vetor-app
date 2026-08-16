'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, limit, orderBy } from 'firebase/firestore';
import Link from 'next/link';
import Image from 'next/image';
import { useGeo } from '@/lib/i18n/GeoContext';

interface RelatedProduct {
  id: string;
  name: string;
  price: number;
  slug?: string;
  urls: {
    capa?: string;
    destaque?: string;
  };
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
        // Busca produtos da mesma categoria (máximo 6 para filtrar o atual e exibir 5)
        const q = query(
          collection(db, 'products'),
          where('category', '==', category),
          orderBy('createdAt', 'desc'),
          limit(6)
        );
        const snap = await getDocs(q);
        const items = snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as RelatedProduct))
          .filter((p) => p.id !== currentProductId)
          .slice(0, 5);
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
    <section className="mt-16 pt-10 border-t border-[#f1f3f4]">
      <h2 className="text-[11px] font-bold text-[#999] uppercase tracking-[0.2em] mb-6">
        Produtos Relacionados em {category}
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
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
              {/* Thumbnail com lazy loading — não é LCP */}
              <div className="aspect-[4/5] relative rounded-[1.5rem] overflow-hidden bg-[#f8f9fa] group-hover:bg-black transition-all duration-300 group-hover:shadow-lg group-hover:shadow-black/20 mb-3">
                {imgSrc ? (
                  <Image
                    src={imgSrc}
                    alt={`Arte em vetor para camiseta ${tp(product.name)} - CDR, PDF, SVG, PNG`}
                    fill
                    sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 20vw"
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

              <h3 className="text-[10px] font-medium text-gray-500 uppercase tracking-[0.12em] mb-1 truncate text-center">
                {tp(product.name)}
              </h3>
              <p className="text-[14px] font-semibold text-[#333333] tracking-tight text-center">
                {formatPrice(product.price || 0)}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}