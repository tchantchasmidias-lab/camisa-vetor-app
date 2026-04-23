import Image from 'next/image';
import Link from 'next/link';

const categories = [
  { id: 3, name: 'Formatura', imageUrl: ''},
  { id: 2, name: 'Futebol', imageUrl: ''},
  { id: 1, name: '9º Ano', imageUrl: ''},
  { id: 4, name: 'Animais', imageUrl: ''},
  { id: 5, name: 'Empresas', imageUrl: ''},
  { id: 6, name: 'Games', imageUrl: ''},
  { id: 7, name: 'Geek & Nerds', imageUrl: ''},
  { id: 8, name: 'Heróis', imageUrl: ''},
  { id: 9, name: 'Música', imageUrl: ''},
  { id: 10, name: 'Profissões', imageUrl: ''},
];

// AJUSTE: Espaçamento entre círculo e texto reduzido (space-y-1)
const CategoryStory = ({ name, imageUrl }: { name: string, imageUrl: string }) => (
  <Link href="#" className="flex-shrink-0 flex flex-col items-center space-y-1 group w-32">
    <div className="p-0.5 bg-gradient-to-tr from-laranja via-fuchsia-500 to-indigo-500 rounded-full group-hover:scale-105 transition-transform duration-300 ease-in-out">
      <div className="bg-white p-1 rounded-full">
        {/* AJUSTE: Círculo ampliado para 112px (w-28, h-28) */}
        <div className="w-28 h-28 relative rounded-full overflow-hidden">
            {imageUrl ? (
                <Image src={imageUrl} alt={name} layout="fill" objectFit="cover" />
            ) : (
                <div className="w-full h-full bg-gray-200 object-cover rounded-full" />
            )}
        </div>
      </div>
    </div>
    <p className="text-sm font-semibold text-gray-800 w-full text-center truncate">{name}</p>
  </Link>
);

export default function CategoryCarousel() {
  return (
    // AJUSTE: Espaçamento vertical compactado (pt-0 pb-2)
    <section className="w-full pt-0 pb-2">
      <div className="max-w-7xl mx-auto">
        {/*
          - AJUSTE: Centralização no desktop (md:justify-center).
          - AJUSTE: Padding lateral aumentado (px-6).
        */}
        <div className="flex items-start space-x-4 overflow-x-auto overflow-y-hidden hide-scrollbar px-6 md:justify-center">
          {categories.map(category => (
            <CategoryStory key={category.id} name={category.name} imageUrl={category.imageUrl} />
          ))}
        </div>
      </div>
    </section>
  );
}
