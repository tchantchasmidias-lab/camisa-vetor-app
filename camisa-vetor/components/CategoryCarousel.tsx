'use client';

import { useRef } from 'react';
import Image from 'next/image';
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
    <div className="p-0.5 bg-gradient-to-tr from-laranja via-fuchsia-500 to-indigo-500 rounded-full group-hover:scale-105 transition-transform duration-300 ease-in-out">
      <div className="bg-white p-1 rounded-full">
        <div className="w-28 h-28 relative rounded-full overflow-hidden">
          {imageUrl ? (
            <Image src={imageUrl} alt={name} layout="fill" objectFit="cover" />
          ) : (
            <div className="w-full h-full bg-gray-200 object-cover rounded-full" />
          )}
        </div>
      </div>
    </div>
    <p className="text-[13px] font-semibold text-gray-800 w-full text-center truncate mt-2">{name}</p>
  </Link>
);

export default function CategoryCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    scrollRef.current?.scrollBy({ left: -350, behavior: 'smooth' });
  };

  const scrollRight = () => {
    scrollRef.current?.scrollBy({ left: 350, behavior: 'smooth' });
  };

  return (
    <section className="w-full mt-24 mb-4 bg-white">
      <div className="max-w-7xl mx-auto relative group">
        <button
          onClick={scrollLeft}
          className="hidden md:flex items-center justify-center absolute top-1/2 -translate-y-1/2 left-4 z-20 bg-white/70 hover:bg-white shadow-md text-gray-800 p-2 rounded-full transition-all"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <button
          onClick={scrollRight}
          className="hidden md:flex items-center justify-center absolute top-1/2 -translate-y-1/2 right-4 z-20 bg-white/70 hover:bg-white shadow-md text-gray-800 p-2 rounded-full transition-all"
        >
          <ChevronRight className="h-6 w-6" />
        </button>

        <div 
          ref={scrollRef}
          className="flex items-start justify-start md:justify-center space-x-6 overflow-x-auto overflow-y-visible pt-6 pb-4 hide-scrollbar"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <div className="w-6 flex-shrink-0"></div>
          {categories.map(category => (
            <CategoryStory key={category.id} name={category.name} imageUrl={category.imageUrl} />
          ))}
          <div className="w-6 flex-shrink-0"></div>
        </div>
      </div>
    </section>
  );
}
