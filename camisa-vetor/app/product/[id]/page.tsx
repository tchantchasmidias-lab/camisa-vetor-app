
'use client';

import { useState } from 'react';
import { CreditCard, Zap, Download, Shirt, Check } from 'lucide-react';

// ETAPA 5: DINAMISMO DE DADOS E GALERIA FUNCIONAL

const getProductData = (id: string) => {
  return {
    id: id,
    name: 'Arte Vetor Exemplo',
    description: 'Esta arte é um produto digital profissional, ideal para camisetas personalizadas, eventos e projetos de design.',
    price: 29.90,
    oldPrice: 59.90,
    images: [
      { id: 1, url: '/placeholder-main.png' },
      { id: 2, url: '/placeholder-thumb-1.png' },
      { id: 3, url: '/placeholder-thumb-2.png' },
      { id: 4, url: '/placeholder-thumb-3.png' },
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
    <main className="min-h-screen bg-white pt-[80px] md:pt-[120px]">
      <div className="max-w-7xl mx-auto px-4 pb-20">
        <div className="flex flex-col lg:flex-row lg:gap-x-12 xl:gap-x-16">

          {/* Coluna 1: Galeria Dinâmica e Sticky */}
          <div className="w-full lg:w-[45%] lg:sticky top-[120px] self-start">
            <div key={selectedImage.id} className="aspect-square w-full bg-gray-100 rounded-[32px]">
              {/* A imagem principal seria renderizada aqui */}
            </div>
            <div className="grid grid-cols-4 gap-4 mt-4">
              {product.images.map((image) => (
                <div
                  key={image.id}
                  onClick={() => setSelectedImage(image)}
                  className={`cursor-pointer aspect-square bg-gray-100 rounded-xl ${
                    selectedImage.id === image.id ? 'border-2 border-[#fe7302]' : ''
                  }`}
                ></div>
              ))}
            </div>
          </div>

          {/* Coluna 2: Informações e Compra Dinâmicas */}
          <div className="w-full lg:flex-1 mt-8 lg:mt-0">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 uppercase leading-tight">{product.name}</h1>
            <p className="text-gray-600 mt-3 text-base leading-relaxed">{product.description}</p>
            
            <div className="flex items-baseline gap-2 mt-6">
              <span className="text-3xl font-bold text-gray-900">R$ {product.price.toFixed(2).replace('.', ',')}</span>
              <span className="text-lg text-gray-400 line-through">R$ {product.oldPrice.toFixed(2).replace('.', ',')}</span>
            </div>

            <button className="w-full bg-[#fe7302] text-white font-bold py-4 px-6 rounded-2xl mt-6 flex items-center justify-center gap-3 hover:bg-opacity-90 transition-colors shadow-lg">
              <CreditCard size={20} />
              <span>COMPRAR AGORA</span>
            </button>

            {/* Banner de Formas de Pagamento */}
            <div className="mt-4 h-16 w-full bg-gray-100 rounded-xl flex items-center justify-center text-sm text-gray-400">
                <span>Selos de Pagamento (Pix, Mercado Pago, etc.)</span>
            </div>

            <div className="mt-8">
              <h3 className="text-sm font-semibold text-gray-800">Formatos incluídos:</h3>
              <div className="grid grid-cols-4 gap-3 text-center mt-3">
                {product.formats.map(format => (
                  <div key={format} className="border border-gray-200 bg-gray-50 rounded-lg py-2 px-3 text-xs font-bold text-gray-700">
                    {format}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4 mt-8 pt-6 border-t border-gray-100">
              <div className="flex items-center gap-3 text-sm text-gray-700">
                <Zap size={18} className="text-blue-500" />
                <span><strong>Entrega Automática:</strong> Link enviado ao seu e-mail.</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-700">
                <Download size={18} className="text-green-500" />
                <span><strong>Produto Digital:</strong> Download imediato.</span>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100">
                <h3 className="text-base font-bold text-gray-800 mb-4">Descrição Técnica</h3>
                <ul className="space-y-3">
                    {product.technicalDetails.map(detail => (
                        <li key={detail} className="flex items-start gap-3 text-sm text-gray-600">
                            <Check size={18} className="text-green-500 flex-shrink-0 mt-0.5" />
                            <span>{detail}</span>
                        </li>
                    ))}
                </ul>
            </div>
          </div>
  
          {/* Coluna 3: Sidebar de Produção (Oculta no Mobile) */}
          <aside className="hidden lg:block lg:w-[240px] flex-shrink-0 mt-8 lg:mt-0">
            <div className="w-full">
              <h3 className="text-base font-bold text-gray-800 mb-4">Categorias</h3>
              <nav>
                <ul>
                  {categories.map((category, index) => (
                    <li key={category}>
                      <span className={`flex items-center gap-3 text-sm text-gray-600 border-b border-gray-100 ${index === 0 ? 'pb-3' : 'py-3'}`}>
                        <Shirt size={16} />
                        <span>{category}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </nav>
              <div className="aspect-[4/5] w-full bg-gray-100 rounded-2xl mt-8"></div>
            </div>
          </aside>

        </div>
      </div>
    </main>
  );
}
