'use client';

import { useState, useEffect, useRef } from 'react';
import ProductCard from './ProductCard';

// Dados de exemplo para demonstração
const initialProducts = [
  { id: 1, name: 'Moletom Básico', price: 'R$ 129,90', imageUrl: '' },
  { id: 2, name: 'Camiseta Básica', price: 'R$ 79,90', imageUrl: '' },
  { id: 3, name: 'Moletom Canguru', price: 'R$ 149,90', imageUrl: '' },
  { id: 4, name: 'Camiseta Longline', price: 'R$ 89,90', imageUrl: '' },
  { id: 5, name: 'Moletom Tie-Dye', price: 'R$ 159,90', imageUrl: '' },
  { id: 6, name: 'Camiseta Estampada', price: 'R$ 99,90', imageUrl: '' },
  { id: 7, name: 'Moletom Oversized', price: 'R$ 169,90', imageUrl: '' },
  { id: 8, name: 'Camiseta Gola V', price: 'R$ 84,90', imageUrl: '' },
];

export default function ProductGrid() {
  const [products, setProducts] = useState(initialProducts);
  const [isLoading, setIsLoading] = useState(false);
  // AJUSTE: useRef para referenciar o elemento de gatilho do scroll
  const loaderRef = useRef<HTMLDivElement>(null);

  const loadMoreProducts = async () => {
    if (isLoading) return;
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simula delay de rede
    const newProducts = initialProducts.map(p => ({ ...p, id: p.id + products.length }));
    setProducts(prev => [...prev, ...newProducts]);
    setIsLoading(false);
  };

  // AJUSTE: Substituição do useInView pela API nativa IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];
        if (firstEntry.isIntersecting && !isLoading) {
          loadMoreProducts();
        }
      },
      { threshold: 1.0 } // Aciona quando o elemento está 100% visível
    );

    const currentLoader = loaderRef.current;
    if (currentLoader) {
      observer.observe(currentLoader);
    }

    // Limpeza: Desconecta o observer quando o componente é desmontado
    return () => {
      if (currentLoader) {
        observer.unobserve(currentLoader);
      }
    };
  }, [isLoading]);

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-12">
        {products.map(product => (
          <ProductCard key={product.id} {...product} />
        ))}
      </div>

      {/* Elemento observável (loader) */}
      <div ref={loaderRef} className="flex justify-center items-center py-10">
        {isLoading && (
          <div className="flex items-center space-x-2 text-gray-500">
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Carregando...</span>
          </div>
        )}
      </div>
    </div>
  );
}
