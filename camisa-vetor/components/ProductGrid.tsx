'use client';

import Image from 'next/image';
import Link from 'next/link';

// Dados fictícios com placeholders
const products = [
  { id: 1, name: 'Vetor Samurai', price: 'R$ 59,90', imageUrl: '' },
  { id: 2, name: 'Vetor Águia', price: 'R$ 49,90', imageUrl: '' },
  { id: 3, name: 'Vetor Espacial', price: 'R$ 55,00', imageUrl: '' },
  { id: 4, name: 'Vetor Lobo', price: 'R$ 52,90', imageUrl: '' },
  { id: 5, name: 'Vetor Floral', price: 'R$ 45,90', imageUrl: '' },
  { id: 6, name: 'Vetor Dragão', price: 'R$ 62,00', imageUrl: '' },
  { id: 7, name: 'Vetor Caveira', price: 'R$ 58,00', imageUrl: '' },
  { id: 8, name: 'Vetor Tigre', price: 'R$ 59,90', imageUrl: '' },
];

export default function ProductGrid() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
      {products.map((product) => (
        <div key={product.id} className="group bg-white/5 rounded-2xl overflow-hidden border border-white/10">
          <Link href={`/product/${product.id}`}>
            <div className="overflow-hidden">
                {product.imageUrl ? (
                    <Image
                        src={product.imageUrl}
                        alt={product.name}
                        width={1080}
                        height={1350}
                        className="aspect-[4/5] w-full object-cover rounded-t-lg transition-transform duration-300 ease-in-out group-hover:scale-105"
                    />
                ) : (
                    <div className="aspect-[4/5] w-full bg-gray-200 rounded-t-lg flex items-center justify-center">
                        <p className="text-gray-400">1080x1350</p>
                    </div>
                )}
            </div>
            <div className="p-4">
              {/* Cor do texto do nome do produto alterada para cinza escuro */}
              <h3 className="text-md font-semibold text-gray-800 truncate">{product.name}</h3>
              <p className="text-lg font-bold text-[#fe7302]">
                {product.price}
              </p>
            </div>
          </Link>
        </div>
      ))}
    </div>
  );
}
