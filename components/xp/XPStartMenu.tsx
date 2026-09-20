'use client';

import React, { useRef, useEffect } from 'react';
import { 
  Folder, Image as ImageIcon, ShoppingCart, FileText, 
  Globe, HardDrive, HelpCircle, Search, Power, LogOut, Settings
} from 'lucide-react';

interface XPStartMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenExplorer: () => void;
  onOpenViewer: () => void;
  onOpenCart: () => void;
  onOpenNotepad: () => void;
  onOpenBrowser?: () => void;
  onOpenShutdown: () => void;
  onPlayClick: () => void;
}

export default function XPStartMenu({
  isOpen,
  onClose,
  onOpenExplorer,
  onOpenViewer,
  onOpenCart,
  onOpenNotepad,
  onOpenBrowser,
  onOpenShutdown,
  onPlayClick,
}: XPStartMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        const target = e.target as HTMLElement;
        if (!target.closest('#xp-start-button')) {
          onClose();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className="fixed bottom-9 left-0 z-[9990] w-80 sm:w-96 rounded-tr-lg shadow-2xl border-t-2 border-r-2 border-[#0055ea] overflow-hidden select-none font-sans"
    >
      {/* ── CABEÇALHO DO MENU (AVATAR E USUÁRIO) ── */}
      <div className="h-14 bg-gradient-to-r from-[#0058e6] via-[#106bf8] to-[#0055ea] px-3 flex items-center gap-3 border-b border-[#003da8] shadow-inner">
        <div className="w-10 h-10 rounded border-2 border-white/80 bg-white shadow-md overflow-hidden flex items-center justify-center">
          <img src="/logo-icon.png" alt="Camisa Vetor" className="w-8 h-8 object-contain" />
        </div>
        <div className="flex flex-col text-white">
          <span className="font-bold text-sm leading-tight drop-shadow">Designer Camisa Vetor</span>
          <span className="text-[10px] text-blue-100 font-medium">Windows XP Professional</span>
        </div>
      </div>

      {/* ── DUAS COLUNAS PRINCIPAIS ── */}
      <div className="flex bg-white min-h-[340px]">
        {/* Coluna Esquerda (Programas Principais - Fundo Branco) */}
        <div className="flex-1 p-2 flex flex-col justify-between border-r border-[#96aecd]">
          <div className="space-y-1">
            {/* Internet Explorer */}
            <button
              onClick={() => {
                onPlayClick();
                if (onOpenBrowser) {
                  onOpenBrowser();
                }
                onClose();
              }}
              className="w-full text-left flex items-center gap-2.5 p-2 rounded hover:bg-[#2f71cd] hover:text-white text-gray-800 transition-colors group cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-blue-100 text-[#0055ea] flex items-center justify-center group-hover:bg-white shrink-0 shadow-xs">
                <Globe size={18} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold leading-tight">Internet Explorer</span>
                <span className="text-[10px] text-gray-400 group-hover:text-blue-100">Redes Sociais & Web</span>
              </div>
            </button>

            {/* Catálogo de Vetores */}
            <button
              onClick={() => { onPlayClick(); onOpenExplorer(); onClose(); }}
              className="w-full text-left flex items-center gap-2.5 p-2 rounded hover:bg-[#2f71cd] hover:text-white text-gray-800 transition-colors group cursor-pointer"
            >
              <div className="w-8 h-8 rounded bg-amber-100 text-[#f5a623] flex items-center justify-center group-hover:bg-white shrink-0">
                <Folder size={18} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold leading-tight">Catálogo de Vetores</span>
                <span className="text-[10px] text-gray-400 group-hover:text-blue-100">Explorar arquivos .CDR</span>
              </div>
            </button>

            {/* Visualizador de Imagens */}
            <button
              onClick={() => { onPlayClick(); onOpenViewer(); onClose(); }}
              className="w-full text-left flex items-center gap-2.5 p-2 rounded hover:bg-[#2f71cd] hover:text-white text-gray-800 transition-colors group cursor-pointer"
            >
              <div className="w-8 h-8 rounded bg-purple-100 text-purple-600 flex items-center justify-center group-hover:bg-white shrink-0">
                <ImageIcon size={18} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold leading-tight">Visualizador de Imagens</span>
                <span className="text-[10px] text-gray-400 group-hover:text-blue-100">Zoom e detalhes da estampa</span>
              </div>
            </button>

            {/* Carrinho de Compras */}
            <button
              onClick={() => { onPlayClick(); onOpenCart(); onClose(); }}
              className="w-full text-left flex items-center gap-2.5 p-2 rounded hover:bg-[#2f71cd] hover:text-white text-gray-800 transition-colors group cursor-pointer"
            >
              <div className="w-8 h-8 rounded bg-orange-100 text-[#fe7302] flex items-center justify-center group-hover:bg-white shrink-0">
                <ShoppingCart size={18} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold leading-tight">Carrinho de Compras</span>
                <span className="text-[10px] text-gray-400 group-hover:text-blue-100">Finalizar seus pedidos</span>
              </div>
            </button>

            {/* Bloco de Notas */}
            <button
              onClick={() => { onPlayClick(); onOpenNotepad(); onClose(); }}
              className="w-full text-left flex items-center gap-2.5 p-2 rounded hover:bg-[#2f71cd] hover:text-white text-gray-800 transition-colors group cursor-pointer"
            >
              <div className="w-8 h-8 rounded bg-sky-100 text-sky-600 flex items-center justify-center group-hover:bg-white shrink-0">
                <FileText size={18} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold leading-tight">Bloco de Notas</span>
                <span className="text-[10px] text-gray-400 group-hover:text-blue-100">LEIAME.txt & Dicas</span>
              </div>
            </button>
          </div>

          <div className="pt-2 border-t border-gray-100 text-center">
            <span className="text-[11px] font-bold text-[#0055ea]">Todos os Programas ▸</span>
          </div>
        </div>

        {/* Coluna Direita (Atalhos do Sistema - Fundo Azul Claro #d3e5fa) */}
        <div className="w-36 sm:w-44 bg-[#d3e5fa] p-2 flex flex-col justify-between text-xs text-[#0a246a]">
          <div className="space-y-1">
            <button
              onClick={() => { onPlayClick(); onOpenExplorer(); onClose(); }}
              className="w-full text-left p-1 rounded hover:bg-[#2f71cd] hover:text-white font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Folder size={14} className="text-[#f5a623]" />
              <span>Meus Vetores</span>
            </button>

            <button
              onClick={() => { onPlayClick(); onOpenViewer(); onClose(); }}
              className="w-full text-left p-1 rounded hover:bg-[#2f71cd] hover:text-white font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <ImageIcon size={14} className="text-purple-600" />
              <span>Minhas Imagens</span>
            </button>

            <button
              onClick={() => { onPlayClick(); onOpenExplorer(); onClose(); }}
              className="w-full text-left p-1 rounded hover:bg-[#2f71cd] hover:text-white font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <HardDrive size={14} className="text-blue-600" />
              <span>Meu Computador</span>
            </button>

            <div className="w-full h-px bg-[#b5c7de] my-1" />

            <button
              onClick={() => { onPlayClick(); onOpenNotepad(); onClose(); }}
              className="w-full text-left p-1 rounded hover:bg-[#2f71cd] hover:text-white flex items-center gap-1.5 text-gray-700 cursor-pointer"
            >
              <Settings size={14} />
              <span>Configurações</span>
            </button>

            <button
              onClick={() => { onPlayClick(); onOpenNotepad(); onClose(); }}
              className="w-full text-left p-1 rounded hover:bg-[#2f71cd] hover:text-white flex items-center gap-1.5 text-gray-700 cursor-pointer"
            >
              <HelpCircle size={14} />
              <span>Ajuda e Suporte</span>
            </button>

            <button
              onClick={() => { onPlayClick(); onOpenExplorer(); onClose(); }}
              className="w-full text-left p-1 rounded hover:bg-[#2f71cd] hover:text-white flex items-center gap-1.5 text-gray-700 cursor-pointer"
            >
              <Search size={14} />
              <span>Pesquisar</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── RODAPÉ DO MENU (LOGOFF E DESLIGAR) ── */}
      <div className="h-10 bg-gradient-to-r from-[#0042ad] to-[#1c5fcf] px-3 flex items-center justify-end gap-3 text-white">
        <button
          onClick={() => { onPlayClick(); onOpenShutdown(); onClose(); }}
          className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-white/20 active:scale-95 text-xs font-bold cursor-pointer"
        >
          <div className="w-5 h-5 rounded bg-amber-500 flex items-center justify-center text-white">
            <LogOut size={12} />
          </div>
          <span>Fazer logoff</span>
        </button>

        <button
          onClick={() => { onPlayClick(); onOpenShutdown(); onClose(); }}
          className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-white/20 active:scale-95 text-xs font-bold cursor-pointer"
        >
          <div className="w-5 h-5 rounded bg-red-600 flex items-center justify-center text-white">
            <Power size={12} strokeWidth={2.5} />
          </div>
          <span>Desligar o computador</span>
        </button>
      </div>
    </div>
  );
}
