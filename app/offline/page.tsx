'use client';

import { WifiOff, RefreshCw } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
      {/* Ícone de sem internet */}
      <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mb-6">
        <WifiOff size={36} className="text-[#fe7302]" />
      </div>

      {/* Texto */}
      <h1 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-3">
        Sem conexão
      </h1>
      <p className="text-sm text-gray-500 font-medium max-w-xs leading-relaxed">
        Parece que você está offline. Verifique sua conexão com a internet e tente novamente.
      </p>

      {/* Botão */}
      <button
        onClick={() => window.location.reload()}
        className="mt-8 flex items-center gap-2 bg-[#fe7302] text-white font-black text-xs uppercase tracking-widest px-8 py-4 rounded-2xl hover:bg-[#e56600] active:scale-[0.98] transition-all shadow-lg shadow-orange-500/20"
      >
        <RefreshCw size={16} />
        Tentar Novamente
      </button>

      {/* Rodapé */}
      <p className="mt-16 text-[10px] font-bold text-gray-300 uppercase tracking-widest">
        © {new Date().getFullYear()} Camisa Vetor
      </p>
    </div>
  );
}
