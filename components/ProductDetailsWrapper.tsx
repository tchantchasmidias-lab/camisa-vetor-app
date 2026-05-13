'use client';

import { Suspense } from 'react';
import ProductDetailView from '@/components/ProductDetailView';
import RelatedProducts from '@/components/RelatedProducts';
import { Loader2 } from 'lucide-react';

export default function ProductDetailsWrapper({ product }: { product: any }) {
  if (!product) return null;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* 
        AJUSTE FINO: 
        pt-20 (Mobile) - Reduzido para aproximar do Header
        md:pt-24 (Desktop) - Espaçamento ideal para não ficar "longe" nem "colado"
      */}
      <main className="flex-grow pt-[28px] md:pt-4">
        
        {/* Visualização Principal do Produto */}
        <ProductDetailView product={product} />
       
        {/* Seção de Relacionados */}
        <div className="max-w-7xl mx-auto px-4 mt-12 pb-[20px] md:pb-20">
          <Suspense fallback={
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="animate-spin text-orange-200 mb-4" size={32} />
              <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Buscando artes similares...</p>
            </div>
          }>
            <RelatedProducts
              category={product?.category}
              currentProductId={product?.id}
            />
          </Suspense>
        </div>

      </main>
    </div>
  );
}