'use client';



import { useState } from 'react';

import { CreditCard, Zap, Download, Shirt, Check, Heart, ShieldCheck } from 'lucide-react';

// CORREÇÃO: Importação do Link que estava faltando

import Link from 'next/link';



export default function ProductClientPage({ product, categories }: any) {

  // Verificação de segurança para evitar quebras de renderização

  if (!product) return null;



  // Estado para a galeria de imagens

  const [selectedImage, setSelectedImage] = useState(product.images?.[0] || { id: '0', url: '' });

  const [isFavorite, setIsFavorite] = useState(false);



  return (

    <div className="max-w-7xl mx-auto px-4 pb-20 font-sans">

      <div className="flex flex-col lg:flex-row lg:gap-x-12 xl:gap-x-16 items-start relative">



        {/* Coluna 1: Galeria (Efeito Sticky no Desktop) */}

        <div className="w-full lg:w-[45%] lg:sticky top-[120px] self-start mb-8 lg:mb-0">

          <div className="relative aspect-square w-full bg-gray-50 rounded-[32px] overflow-hidden border border-gray-100 shadow-sm group">

            <img

              key={selectedImage.id}

              src={selectedImage.url}

              alt={product.name}

              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"

            />

            {/* Botão de Favorito flutuante */}

            <button

              onClick={() => setIsFavorite(!isFavorite)}

              className="absolute top-6 right-6 p-4 bg-white rounded-full shadow-xl hover:scale-110 transition-all active:scale-90 z-20"

            >

              <Heart size={20} className={isFavorite ? 'fill-[#fe7302] text-[#fe7302]' : 'text-gray-300'} />

            </button>

          </div>



          {/* Thumbnails */}

          <div className="grid grid-cols-4 gap-4 mt-4">

            {product.images?.map((image: any) => (

              <div

                key={image.id}

                onClick={() => setSelectedImage(image)}

                className={`cursor-pointer aspect-square bg-gray-50 rounded-2xl overflow-hidden border-2 transition-all ${

                  selectedImage.id === image.id ? 'border-[#fe7302] shadow-md' : 'border-transparent opacity-70 hover:opacity-100'

                }`}

              >

                <img src={image.url} alt="Thumbnail" className="w-full h-full object-cover" />

              </div>

            ))}

          </div>

        </div>



        {/* Coluna 2: Informações do Produto */}

        <div className="w-full lg:flex-1 lg:mt-[-4px]">

          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#fe7302] mb-3 block">

            {product.category || 'Vetor Premium'}

          </span>

         

          <h1 className="text-2xl lg:text-3xl font-black text-[#1a1a1a] uppercase leading-tight tracking-tighter">

            {product.name}

          </h1>

         

          <p className="text-gray-500 mt-4 text-sm leading-relaxed max-w-lg font-medium">

            {product.description}

          </p>

         

          <div className="flex items-baseline gap-3 mt-8">

            <span className="text-4xl font-black text-gray-900 tracking-tighter">

              R$ {typeof product.price === 'number' ? product.price.toFixed(2).replace('.', ',') : product.price}

            </span>

            {product.oldPrice && (

              <span className="text-lg text-gray-300 line-through font-bold">

                R$ {typeof product.oldPrice === 'number' ? product.oldPrice.toFixed(2).replace('.', ',') : product.oldPrice}

              </span>

            )}

          </div>



          {/* Botões de Ação */}

          <div className="mt-10 space-y-4">

            <button className="w-full bg-[#fe7302] text-white font-black py-5 px-6 rounded-[1.25rem] flex items-center justify-center gap-4 hover:bg-black transition-all shadow-xl shadow-[#fe7302]/20 text-[11px] uppercase tracking-[0.2em] active:scale-[0.98]">

              <CreditCard size={20} strokeWidth={2.5} />

              <span>COMPRAR AGORA</span>

            </button>



            <div className="h-14 w-full bg-gray-50 rounded-2xl flex items-center justify-center text-[9px] text-gray-400 border border-gray-100 uppercase tracking-widest font-black">

               <span>Pix • Cartão • Mercado Pago</span>

            </div>

          </div>



          {/* Formatos */}

          <div className="mt-12">

            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-5">Formatos incluídos:</h3>

            <div className="grid grid-cols-4 gap-3">

              {(product.formats || ['CDR', 'PDF', 'AI']).map((format: string) => (

                <div key={format} className="border border-gray-100 bg-white shadow-sm rounded-xl py-3 px-2 text-[10px] font-black text-gray-800 uppercase text-center hover:border-[#fe7302]/30 transition-colors">

                  {format}

                </div>

              ))}

            </div>

          </div>



          {/* Selos de Entrega */}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-12 pt-8 border-t border-gray-100">

            <div className="flex items-center gap-3 text-[10px] text-gray-700 font-black uppercase tracking-widest">

              <Zap size={18} className="text-blue-500" />

              <span>Entrega Automática</span>

            </div>

            <div className="flex items-center gap-3 text-[10px] text-gray-700 font-black uppercase tracking-widest">

              <Download size={18} className="text-green-500" />

              <span>Download Imediato</span>

            </div>

          </div>



          {/* Descrição Técnica */}

          <div className="mt-12 pt-8 border-t border-gray-100">

            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Especificações Técnicas</h3>

            <ul className="space-y-4">

              {product.technicalDetails?.map((detail: string) => (

                <li key={detail} className="flex items-start gap-3 text-[11px] text-gray-600 font-bold leading-tight">

                  <Check size={16} className="text-green-500 flex-shrink-0" strokeWidth={3} />

                  <span>{detail}</span>

                </li>

              ))}

            </ul>

          </div>

        </div>



        {/* Coluna 3: Sidebar de Categorias */}

        <aside className="hidden lg:block lg:w-[200px] flex-shrink-0 lg:mt-[-4px]">

          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Categorias</h3>

          <nav>

            <ul className="space-y-1">

              {(categories || []).map((category: string) => (

                <li key={category}>

                  <Link href={`/?category=${encodeURIComponent(category)}`} className="category-sidebar-item category-list-link flex items-center gap-3 text-[10px] font-bold text-gray-500 py-3 border-b border-gray-50 hover:text-[#fe7302] transition-colors uppercase tracking-widest">

                    <Shirt size={14} className="opacity-50" />

                    <span>{category}</span>

                  </Link>

                </li>

              ))}

            </ul>

          </nav>



          {/* Espaço de Garantia */}

          <div className="mt-16">

            <div className="aspect-[4/5] w-full bg-gray-50 rounded-[2rem] border border-dashed border-gray-200 flex flex-col items-center justify-center p-6 text-center">

              <ShieldCheck size={24} className="text-gray-200 mb-3" />

              <span className="text-[9px] text-gray-300 font-black uppercase tracking-widest">Garantia Camisa Vetor</span>

            </div>

          </div>

        </aside>



      </div>

    </div>

  );

}