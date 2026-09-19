'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Moon, Power, RotateCw } from 'lucide-react';

interface XPShutdownDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onRestart: () => void;
  onPlayClick: () => void;
  onPlayShutdown: () => void;
}

export default function XPShutdownDialog({
  isOpen,
  onClose,
  onRestart,
  onPlayClick,
  onPlayShutdown,
}: XPShutdownDialogProps) {
  const router = useRouter();

  if (!isOpen) return null;

  const handleTurnOff = () => {
    onPlayShutdown();
    setTimeout(() => {
      router.push('/');
    }, 1200);
  };

  const handleRestart = () => {
    onPlayClick();
    onRestart();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-[2px] select-none font-sans">
      <div className="w-[340px] sm:w-[380px] bg-gradient-to-r from-[#003399] via-[#0055ea] to-[#003399] p-0.5 rounded-lg shadow-2xl border border-white/40">
        {/* Barra de Título */}
        <div className="px-3 py-2 flex items-center justify-between text-white border-b border-white/20">
          <span className="font-bold text-sm drop-shadow">Desligar o computador</span>
          <img src="/logo-icon.png" alt="Camisa Vetor" className="w-5 h-5 object-contain" />
        </div>

        {/* Corpo com os 3 botões clássicos */}
        <div className="bg-gradient-to-b from-[#4076e0] to-[#2050b5] px-6 py-8 flex items-center justify-center gap-6">
          {/* Em Espera */}
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={() => { onPlayClick(); onClose(); }}
              className="w-12 h-12 rounded-full bg-gradient-to-b from-[#f5a623] to-[#d68000] border-2 border-white/80 shadow-lg flex items-center justify-center text-white hover:brightness-110 active:scale-95 transition-all cursor-pointer"
              title="Voltar para a área de trabalho"
            >
              <Moon size={22} className="fill-white" />
            </button>
            <span className="text-white text-xs font-bold drop-shadow">Em espera</span>
          </div>

          {/* Desativar (Voltar para a Loja Moderna) */}
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={handleTurnOff}
              className="w-12 h-12 rounded-full bg-gradient-to-b from-[#e81123] to-[#b00c17] border-2 border-white/80 shadow-lg flex items-center justify-center text-white hover:brightness-110 active:scale-95 transition-all cursor-pointer"
              title="Voltar para a loja moderna Camisa Vetor"
            >
              <Power size={22} strokeWidth={2.5} />
            </button>
            <span className="text-white text-xs font-bold drop-shadow">Desativar</span>
          </div>

          {/* Reiniciar */}
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={handleRestart}
              className="w-12 h-12 rounded-full bg-gradient-to-b from-[#458b22] to-[#2c6114] border-2 border-white/80 shadow-lg flex items-center justify-center text-white hover:brightness-110 active:scale-95 transition-all cursor-pointer"
              title="Reiniciar a interface do Windows XP"
            >
              <RotateCw size={22} strokeWidth={2.5} />
            </button>
            <span className="text-white text-xs font-bold drop-shadow">Reiniciar</span>
          </div>
        </div>

        {/* Rodapé com botão Cancelar */}
        <div className="bg-[#1b439e] px-4 py-2 flex justify-end rounded-b-md">
          <button
            onClick={() => { onPlayClick(); onClose(); }}
            className="px-4 py-1 bg-[#ece9d8] hover:bg-[#f5f4ea] text-slate-800 text-xs font-bold rounded border border-[#7f9db9] shadow active:bg-[#d4d0c8] cursor-pointer"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
