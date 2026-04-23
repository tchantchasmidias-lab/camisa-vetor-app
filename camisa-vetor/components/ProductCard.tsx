import Image from 'next/image';

interface ProductCardProps {
  name: string;
  price: string;
  imageUrl: string;
}

export default function ProductCard({ name, price, imageUrl }: ProductCardProps) {
  return (
    <div className="bg-white rounded-lg overflow-hidden group">
      {/* AJUSTE: Proporção da imagem alterada para 4:5 */}
      <div className="relative w-full aspect-[4/5]">
        {imageUrl ? (
            <Image 
              src={imageUrl} 
              alt={name} 
              layout="fill" 
              objectFit="cover" 
              className="rounded-2xl group-hover:scale-105 transition-transform duration-300"
            />
        ) : (
            <div className="w-full h-full bg-gray-200 object-cover rounded-2xl group-hover:scale-105 transition-transform duration-300"></div>
        )}
      </div>
      {/* AJUSTE: Espaçamento interno e tipografia refinados */}
      <div className="p-2">
        <h3 className="text-sm font-semibold text-gray-800 truncate mt-1">{name}</h3>
        <p className="text-sm font-bold text-black mt-0.5">{price}</p>
      </div>
    </div>
  );
}
