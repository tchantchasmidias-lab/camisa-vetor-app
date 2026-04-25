'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const categories = [
  { id: 3, name: 'Formatura', imageUrl: '' },
  { id: 2, name: 'Futebol', imageUrl: '' },
  { id: 1, name: '9º Ano', imageUrl: '' },
  { id: 4, name: 'Animais', imageUrl: '' },
  { id: 5, name: 'Empresas', imageUrl: '' },
  { id: 6, name: 'Games', imageUrl: '' },
  { id: 7, name: 'Geek & Nerds', imageUrl: '' },
  { id: 8, name: 'Heróis', imageUrl: '' },
  { id: 9, name: 'Música', imageUrl: '' },
  { id: 10, name: 'Profissões', imageUrl: '' },
];

const CategoryStory = ({ name, imageUrl }: { name: string, imageUrl: string }) => (
  <Link href="#" className="flex-shrink-0 flex flex-col items-center space-y-1 group w-32">
    {/* AJUSTE: Degradê com as 4 cores específicas: #ff6600, #ff9933, #fe7302 e #000000 */}
    <div 
      className="p-[3px] rounded-full group-hover:scale-105 transition-transform duration-300 ease-in-out shadow-sm"
      style={{
        background: 'linear-gradient(45deg, #ff6600 0%, #ff9933 33%, #fe7302 66%, #000000 100%)'
      }}
    >
      <div className="bg-white p-1 rounded-full">
        {/* Tamanho mantido com a redução de 5% (w-[106px]) */}
        <div className="w-[106px] h-[106px] relative rounded-full overflow-hidden bg-gray-50">
          {imageUrl ? (
            <img src={imageUrl} alt={name} className="w-full h-full object-cover rounded-full" />
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-300 font-black text-4xl">
              {name.charAt(0)}
            </div>
          )}
        </div>
      </div>
    </div>
    <p className="text-[13px] font-semibold text-gray-700 w-full text-center truncate mt-2">{name}</p>
  </Link>
);

export default function CategoryCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    scrollRef.current?.scrollBy({ left: -300, behavior: 'smooth' });
  };

  const scrollRight = () => {
    scrollRef.current?.scrollBy({ left: 300, behavior: 'smooth' });
  };

  return (
    <section className="w-full mt-20 mb-4 bg-white">
      <div className="max-w-7xl mx-auto relative group px-4">
        <button
          onClick={scrollLeft}
          className="hidden md:flex items-center justify-center absolute top-1/2 -translate-y-1/2 left-0 z-20 bg-white/80 hover:bg-white shadow-md text-gray-800 p-2 rounded-full transition-all border border-gray-100"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <button
          onClick={scrollRight}
          className="hidden md:flex items-center justify-center absolute top-1/2 -translate-y-1/2 right-0 z-20 bg-white/80 hover:bg-white shadow-md text-gray-800 p-2 rounded-full transition-all border border-gray-100"
        >
          <ChevronRight className="h-6 w-6" />
        </button>

        <div 
          ref={scrollRef}
          className="flex items-start justify-start md:justify-center space-x-6 overflow-x-auto overflow-y-visible pt-4 pb-4 hide-scrollbar"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {categories.map(category => (
            <CategoryStory key={category.id} name={category.name} imageUrl={category.imageUrl} />
          ))}
        </div>
      </div>
    </section>
  );
}