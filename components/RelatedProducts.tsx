'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { db } from '@/lib/firebase';
import { collection, query, where, limit, getDocs } from 'firebase/firestore';

interface RelatedProduct {
  id: string;
  name: string;
  price: number;
  image: string;
}

import { useGeo } from '@/lib/i18n/GeoContext';

export default function RelatedProducts({
  category,
  currentProductId
}: {
  category: string;
  currentProductId: string;
}) {
  const [products, setProducts] = useState<RelatedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const { t, tp, formatPrice } = useGeo();

  useEffect(() => {
    async function fetchRelated() {
      if (!category) {
        setLoading(false);
        return;
      }

      try {
        // Busca produtos da mesma categoria
        const q = query(
          collection(db, 'products'),
          where('category', '==', category),
          limit(6) // Busca um pouco a mais para garantir o filtro
        );
       
        const querySnapshot = await getDocs(q);
        const items = querySnapshot.docs
          .map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              name: data.name || 'Vetor sem nome',
              price: Number(data.price) || 0,
              // Mantém a lógica de separação: Prioriza a Capa para a vitrine
              image: data.urls?.capa || data.urls?.destaque || 'https://placehold.co/400x500?text=Camisa+Vetor'
            };
          })
          .filter(item => item.id !== currentProductId) // Remove o produto que já está na tela
          .slice(0, 4); // Exibe exatamente 4

        setProducts(items);
      } catch (error) {
        console.error("Erro ao carregar relacionados:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchRelated();
  }, [category, currentProductId]);

  if (loading) return null; // O fallback do Suspense no pai cuida disso
  if (products.length === 0) return null;

  return (
    <div className="mt-16 pt-12 border-t border-[#f1f3f4] animate-in fade-in duration-1000">
      {/* Título Estilo Google Premium */}
      <h2 className="text-[11px] font-bold text-[#5f6368] uppercase tracking-[0.4em] mb-12 text-center">
        {t('youMayAlsoLike')}
      </h2>

      {/* Grade Responsiva: 1 coluna no mobile, 4 no desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-8">
        {products.map((rel) => (
          <Link href={`/product/${rel.id}`} key={rel.id} className="group block">
            <div className="aspect-[4/5] bg-[#fbfbfb] rounded-[2rem] relative overflow-hidden border border-[#dadce0] mb-5 transition-all duration-500 group-hover:shadow-xl group-hover:shadow-gray-100 group-hover:border-[#fe7302]/30">
              <Image
                src={rel.image}
                alt={rel.name}
                fill
                sizes="(max-width: 768px) 100vw, 25vw"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
              />
            </div>
           
            <div className="px-2 text-center">
              <h3 className="text-[10px] font-semibold text-[#202124] uppercase tracking-wider mb-1.5 truncate">
                {tp(rel.name)}
              </h3>
             
              <p className="text-[14px] font-bold text-[#fe7302] tracking-tighter">
                {formatPrice(rel.price)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}