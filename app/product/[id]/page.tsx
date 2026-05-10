'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { notFound } from 'next/navigation';
import ProductDetailsWrapper from '@/components/ProductDetailsWrapper';
import { useGeo } from '@/lib/i18n/GeoContext';

export default function Page({ params }: { params: { id: string } }) {
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { t } = useGeo();

  useEffect(() => {
    async function loadProduct() {
      if (!params.id) return;

      try {
        // Referência direta ao documento no Firestore
        const docRef = doc(db, 'products', params.id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setProduct({ id: docSnap.id, ...docSnap.data() });
        } else {
          console.error("Produto não encontrado no banco.");
          setError(true);
        }
      } catch (err) {
        console.error("Erro ao buscar no Firestore:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
  }, [params.id]);

  if (loading) {
    return (
      <div className="h-screen w-full bg-white flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#fe7302] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-black text-gray-400 uppercase tracking-widest text-[10px]">{t('loadingDetails')}</p>
      </div>
    );
  }

  // Se houver erro ou produto não existir, redireciona para página 404
  if (error || !product) {
    return notFound();
  }

  return <ProductDetailsWrapper product={product} />;
}