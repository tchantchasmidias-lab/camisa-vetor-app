'use client';

import { useState, useEffect, useRef } from 'react';
import ProductCard from './ProductCard';

const initialProducts = [
  { id: 1, name: 'Vetor Abadá Carnaval 2026', price: 'R$ 29,90', imageUrl: 'https://placehold.co/400x500/e2e8f0/64748b?text=Abadá+Carnaval' },
  { id: 2, name: 'Pack Estampas Gospel 50pçs', price: 'R$ 49,90', imageUrl: 'https://placehold.co/400x500/e2e8f0/64748b?text=Artes+Gospel' },
  { id: 3, name: 'Vetor Camisa Interclasse', price: 'R$ 19,90', imageUrl: 'https://placehold.co/400x500/e2e8f0/64748b?text=Interclasse' },
  { id: 4, name: 'Vetor Pesqueira - Especial', price: 'R$ 34,90', imageUrl: 'https://placehold.co/400x500/e2e8f0/64748b?text=Pesqueira+Vetor' },
  { id: 5, name: 'Vetor Logo Super Heróis', price: 'R$ 15,00', imageUrl: 'https://placehold.co/400x500/e2e8f0/64748b?text=Heróis' },
  { id: 6, name: 'Pack Vetores Futebol Europeu', price: 'R$ 59,90', imageUrl: 'https://placehold.co/400x500/e2e8f0/64748b?text=Futebol+Vetor' },
  { id: 7, name: 'Vetor Estampa Minimalista', price: 'R$ 12,90', imageUrl: 'https://placehold.co/400x500/e2e8f0/64748b?text=Minimalista' },
  { id: 8, name: 'Vetor Mockup Camiseta Pro', price: 'R$ 25,00', imageUrl: 'https://placehold.co/400x500/e2e8f0/64748b?text=Mockup+Vetor' },
];

export default function ProductGrid() {
  const [products, setProducts] = useState(initialProducts);
  const [isLoading, setIsLoading] = useState(false);
  const loaderRef = useRef<HTMLDivElement>(null);

  const loadMoreProducts = async () => {
    if (isLoading) return;
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000)); 
    const newProducts = initialProducts.map(p => ({ 
      ...p, 
      id: p.id + products.length,
      name: `${p.name}`
    }));
    setProducts(prev => [...prev, ...newProducts]);
    setIsLoading(false);
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading) {
          loadMoreProducts();
        }
      },
      { threshold: 0.1 }
    );
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => { if (loaderRef.current) observer.unobserve(loaderRef.current); };
  }, [isLoading, products.length]);

  return (
    <div className="py-2">
      {/* Título removido para um layout mais clean */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-10">
        {products.map(product => (
          <ProductCard key={product.id} {...product} />
        ))}
      </div>

      <div ref={loaderRef} className="flex justify-center items-center py-12">
        {isLoading && <span className="text-[#fe7302] font-black animate-pulse uppercase tracking-[0.2em] text-xs">Carregando artes...</span>}
      </div>
    </div>
  );
}