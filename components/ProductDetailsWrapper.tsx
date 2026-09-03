'use client';

import { Suspense } from 'react';
import ProductDetailView from '@/components/ProductDetailView';

export default function ProductDetailsWrapper({ product }: { product: any }) {
  if (!product) return null;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <main className="flex-grow pt-[28px] md:pt-4">
        <Suspense fallback={null}>
          <ProductDetailView product={product} />
        </Suspense>
      </main>
    </div>
  );
}