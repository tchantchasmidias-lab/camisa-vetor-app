'use client';

import { useState } from 'react';
import { CreditCard, Zap, Download, Shirt, Check } from 'lucide-react';

const getProductData = (id: string) => {
  return {
    id: id,
    name: 'Arte Vetor Exemplo',
    description: 'Esta arte é um produto digital profissional, ideal para camisetas personalizadas, eventos e projetos de design.',
    price: 29.90,
    oldPrice: 59.90,
    images: [
      { id: 1, url: 'https://placehold.co/600x600/e2e8f0/64748b?text=Vetor+Principal' },
      { id: 2, url: 'https://placehold.co/600x600/e2e8f0/64748b?text=Thumb+1' },
      { id: 3, url: 'https://placehold.co/600x600/e2e8f0/64748b?text=Thumb+2' },
      { id: 4, url: 'https://placehold.co/600x600/e2e8f0/64748b?text=Thumb+3' },
    ],
    formats: ['CDR', 'PDF', 'SVG', 'PNG'],
    technicalDetails: [
      'Resolução de 300 DPI: Máxima qualidade de impressão.',
      'Cores em CMYK: Fidelidade de cores garantida.',
      '100% Editável: Altere textos, cores e formas como quiser.',
      'Organização em Camadas: Facilidade para encontrar e editar elementos.'
    ],
  };
};

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const product = getProductData(params.id);
  const categories = [
    'FORMATURA', 'FUTEBOL', 'GOSPEL', 'SIGNOS', 'HERÓIS', 'FILMES & SÉRIES', 'BANDAS'
  ];

  const [selectedImage, setSelectedImage] = useState(product.images[0]);

  return (
    <main className="min-h-screen bg-white pt-[80px] md:pt-[120px] text-gray-900 font-sans">
      <div className="max-w-7xl mx-auto px-4 pb-20">
        
        <div className="flex flex-col lg:flex-row lg:gap-x-12 xl:gap-x-16 items-start relative">

          {/* Coluna 1: Galeria (FIXA) */}
          <div className="w-full lg:w-[45%] lg:sticky top-[120px] self-start mb-8 lg:mb-0">
            <div key={selectedImage.id} className="aspect-square w-full bg-gray-100 rounded-[32px] overflow-hidden border border-gray-100 shadow-sm">
               <img 
                src={selectedImage.url} 
                alt={product.name} 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="grid grid-cols-4 gap-4 mt-4">
              {product.images.map((image) => (
                <div
                  key={image.id}
                  onClick={() => setSelectedImage(image)}
                  className={`cursor-pointer aspect-square bg-gray-100 rounded-xl overflow-hidden border-2 transition-all ${
                    selectedImage.id === image.id ? 'border-[#fe7302]' : 'border-transparent'
                  }`}
                >
                  <img src={image.url} alt="Thumbnail" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>

          {/* Coluna 2: Informações (ALINHAMENTO TOTAL - SUBIDO COM MARGEM NEGATIVA) */}
          <div className="w-full lg:flex-1 lg:mt-[-8px] lg:pt-0">
            <h1 className="text-xl lg:text-2xl font-bold text-[#1a1a1a] uppercase leading-tight tracking-tight">
              {product.name}
            </h1>
            <p className="text-gray-500 mt-3 text-sm leading-relaxed max-w-lg">
              {product.description}
            </p>
            
            <div className="flex items-baseline gap-2 mt-6">
              <span className="text-3xl font-bold text-gray-900 tracking-tighter">
                R$ {product.price.toFixed(2).replace('.', ',')}
              </span>
              <span className="text-base text-gray-400 line-through font-medium">
                R$ {product.oldPrice.toFixed(2).replace('.', ',')}
              </span>
            </div>

            <button className="w-full bg-[#fe7302] text-white font-bold py-4 px-6 rounded-2xl mt-8 flex items-center justify-center gap-3 hover:bg-opacity-90 transition-all shadow-lg text-lg transform active:scale-[0.98]">
              <CreditCard size={20} />
              <span>COMPRAR AGORA</span>
            </button>

            <div className="mt-4 h-14 w-full bg-gray-50 rounded-xl flex items-center justify-center text-[10px] text-gray-400 border border-gray-100 uppercase tracking-widest font-bold">
                <span>Pix • Cartão • Mercado Pago</span>
            </div>

            <div className="mt-10">
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Formatos incluídos:</h3>
              <div className="grid grid-cols-4 gap-3 text-center">
                {product.formats.map(format => (
                  <div key={format} className="border border-gray-200 bg-gray-50 rounded-lg py-2 px-3 text-[10px] font-bold text-gray-700 uppercase">
                    {format}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4 mt-10 pt-8 border-t border-gray-100">
              <div className="flex items-center gap-3 text-sm text-gray-700 font-semibold font-sans">
                <Zap size={18} className="text-blue-500" />
                <span>Entrega Automática: <span className="font-medium text-gray-400 ml-1 text-xs uppercase">Link via e-mail</span></span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-700 font-semibold font-sans">
                <Download size={18} className="text-green-500" />
                <span>Produto Digital: <span className="font-medium text-gray-400 ml-1 text-xs uppercase">Download imediato</span></span>
              </div>
            </div>

            <div className="mt-10 pt-8 border-t border-gray-100 pb-20">
                <h3 className="text-sm font-bold text-gray-800 mb-4 uppercase tracking-tight">Descrição Técnica</h3>
                <ul className="space-y-3">
                    {product.technicalDetails.map(detail => (
                        <li key={detail} className="flex items-start gap-3 text-sm text-gray-600 font-sans">
                            <Check size={18} className="text-green-500 flex-shrink-0 mt-0.5" />
                            <span>{detail}</span>
                        </li>
                    ))}
                </ul>
            </div>
          </div>
 
          {/* Coluna 3: Sidebar (ALINHAMENTO TOTAL - SUBIDO COM MARGEM NEGATIVA) */}
          <aside className="hidden lg:block lg:w-[220px] flex-shrink-0 lg:mt-[-8px] lg:pt-0">
            <div className="w-full">
              <nav>
                <ul className="space-y-0.5">
                  {categories.map((category) => (
                    <li key={category}>
                      <span className="flex items-center gap-3 text-[11px] font-bold text-[#4d4d4d] py-3 border-b border-gray-50 hover:text-[#fe7302] transition-colors cursor-pointer uppercase tracking-wider font-sans">
                        <Shirt size={14} className="opacity-70" />
                        <span>{category}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </nav>

              <div className="mt-12">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">
                  Publicidade
                </h3>
                <div className="aspect-[4/5] w-full bg-gray-50 rounded-[2rem] border border-dashed border-gray-200 flex items-center justify-center">
                  <span className="text-[10px] text-gray-300 font-bold uppercase tracking-widest font-sans">Espaço Reservado</span>
                </div>
              </div>
            </div>
          </aside>

        </div>
      </div>
    </main>
  );
}