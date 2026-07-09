import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
      {/* Número 404 estilizado */}
      <div className="relative mb-8">
        <p className="text-[120px] md:text-[180px] font-black text-[#f0f0f0] leading-none select-none">
          404
        </p>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-4xl">🔍</span>
        </div>
      </div>

      {/* Mensagem amigável */}
      <h1 className="text-2xl md:text-3xl font-black text-[#202124] mb-3 tracking-tight">
        Ops! Página não encontrada
      </h1>
      <p className="text-[14px] text-gray-500 max-w-xs mb-10 leading-relaxed">
        A página que você está procurando não existe ou foi movida. Mas não se preocupe, temos muitos vetores esperando por você!
      </p>

      {/* Botão */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 bg-[#fe7302] hover:bg-[#e06600] text-white font-black text-[13px] uppercase tracking-widest px-8 py-4 rounded-2xl transition-all duration-200 shadow-lg shadow-orange-200 hover:shadow-orange-300 hover:-translate-y-0.5"
      >
        🏠 Ver Página Inicial
      </Link>
    </div>
  );
}
