'use client';

import Link from 'next/link';

export default function ProductCard({ id, name, price, imageUrl }: any) {
  return (
    <Link href={`/product/${id}`} className="group block">
      <div className="bg-white rounded-xl overflow-hidden transition-all duration-300 hover:shadow-sm">
        
        {/* Container da Imagem com proporção 4:5 */}
        <div className="aspect-[4/5] w-full bg-[#fcfcfc] relative overflow-hidden rounded-xl border border-gray-100">
          <img 
            src={imageUrl || 'https://placehold.co/400x500?text=Camisa+Vetor'} 
            alt={name} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          />
        </div>

        {/* Informações Refinadas */}
        <div className="pt-4 pb-3 px-3"> 
          {/* AJUSTE: Título aumentado ~10% (de 10px para 11px), mantendo peso médio */}
          <h3 className="text-[11px] font-medium text-gray-700 uppercase tracking-[0.12em] mb-1.5 truncate">
            {name}
          </h3>
          
          <div className="flex items-center justify-between">
            {/* Valor mantido em 70% preto suave */}
            <span className="text-[15px] font-bold text-gray-700 tracking-tight">
              {price}
            </span>
            
            {/* AJUSTE: VER MAIS com peso mais suave (de font-black para font-bold ou font-semibold) */}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <span className="text-[10px] font-semibold text-[#fe7302] uppercase tracking-wider">
                Ver Mais
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}