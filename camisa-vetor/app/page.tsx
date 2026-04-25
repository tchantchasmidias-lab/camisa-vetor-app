'use client';

import CategoryCarousel from "@/components/CategoryCarousel";
import Footer from "@/components/Footer";
import ProductGrid from "@/components/ProductGrid";

export default function Home() {
  return (
    <div className="bg-white">
      {/* Margem negativa sutil para subir o carrossel em direção ao header */}
      <div className="-mt-2 md:mt-0"> 
        <CategoryCarousel />
      </div>
      
      {/* Reduzi o mt para o mínimo possível no mobile */}
      <main className="px-2 md:px-[10%] lg:px-[15%] -mt-1 md:mt-2">
        <ProductGrid />
      </main>
      
      <Footer />
    </div>
  );
}