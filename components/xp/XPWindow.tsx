'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Minus, Square, Copy, X } from 'lucide-react';

export interface XPWindowProps {
  id: string;
  title: string;
  icon?: React.ReactNode;
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  isActive: boolean;
  zIndex: number;
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  onFocus: () => void;
  initialPosition?: { x: number; y: number };
  initialSize?: { width: number; height: number };
  minWidth?: number;
  minHeight?: number;
  menuItems?: string[];
  statusBarText?: string;
  children: React.ReactNode;
}

export default function XPWindow({
  id,
  title,
  icon,
  isOpen,
  isMinimized,
  isMaximized,
  isActive,
  zIndex,
  onClose,
  onMinimize,
  onMaximize,
  onFocus,
  initialPosition = { x: 80, y: 50 },
  initialSize = { width: 720, height: 480 },
  minWidth = 320,
  minHeight = 240,
  menuItems = ['Arquivo', 'Editar', 'Exibir', 'Favoritos', 'Ferramentas', 'Ajuda'],
  statusBarText,
  children,
}: XPWindowProps) {
  const [position, setPosition] = useState(initialPosition);
  const [size, setSize] = useState(initialSize);
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const windowRef = useRef<HTMLDivElement>(null);

  // Centraliza a janela em telas menores na inicialização
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const initialW = Math.min(initialSize.width, Math.max(minWidth, vw - 40));
      const initialH = Math.min(initialSize.height, Math.max(minHeight, vh - 100));
      const initialX = Math.max(10, Math.min(initialPosition.x, vw - initialW - 20));
      const initialY = Math.max(10, Math.min(initialPosition.y, vh - initialH - 60));

      setSize({ width: initialW, height: initialH });
      setPosition({ x: initialX, y: initialY });
    }
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    onFocus();
    isDragging.current = true;
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current || isMaximized) return;
    const newX = Math.max(-size.width + 100, Math.min(window.innerWidth - 80, e.clientX - dragOffset.current.x));
    const newY = Math.max(0, Math.min(window.innerHeight - 80, e.clientY - dragOffset.current.y));
    setPosition({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging.current) {
      isDragging.current = false;
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Ignora
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={windowRef}
      onMouseDown={onFocus}
      style={{
        zIndex,
        ...(isMaximized
          ? { top: 0, left: 0, width: '100vw', height: 'calc(100vh - 36px)' }
          : { top: position.y, left: position.x, width: size.width, height: size.height }),
      }}
      className={`fixed flex flex-col select-none rounded-t-lg shadow-2xl transition-all duration-200 ease-out overflow-hidden border-[3px] ${
        isMinimized
          ? 'opacity-0 scale-90 translate-y-12 pointer-events-none'
          : 'opacity-100 scale-100 translate-y-0'
      } ${
        isActive ? 'border-[#0055ea] shadow-black/50' : 'border-[#7697d9] shadow-black/20'
      }`}
    >
      {/* ── BARRA DE TÍTULO LUNA XP ── */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onDoubleClick={onMaximize}
        className={`h-8 px-2 flex items-center justify-between cursor-move shrink-0 ${
          isActive
            ? 'bg-gradient-to-r from-[#0058e6] via-[#0860f6] to-[#0055ea]'
            : 'bg-gradient-to-r from-[#7697d9] via-[#8eaee9] to-[#7697d9]'
        }`}
      >
        {/* Ícone e Título */}
        <div className="flex items-center gap-1.5 overflow-hidden pointer-events-none">
          {icon && <span className="w-4 h-4 flex items-center justify-center shrink-0">{icon}</span>}
          <span className="text-white font-bold text-[12px] tracking-tight truncate drop-shadow-[1px_1px_0_rgba(0,0,0,0.8)] font-sans">
            {title}
          </span>
        </div>

        {/* Botões de Controle (Minimizar, Maximizar, Fechar) */}
        <div className="flex items-center gap-1 shrink-0 ml-2" onPointerDown={e => e.stopPropagation()}>
          {/* Minimizar */}
          <button
            onClick={onMinimize}
            aria-label="Minimizar"
            className="w-5 h-5 flex items-center justify-center rounded-[3px] bg-[#0058e6] hover:bg-[#3880f6] border border-white/60 active:brightness-90 text-white shadow-inner"
          >
            <Minus size={11} strokeWidth={3} />
          </button>

          {/* Maximizar / Restaurar */}
          <button
            onClick={onMaximize}
            aria-label="Maximizar"
            className="w-5 h-5 flex items-center justify-center rounded-[3px] bg-[#0058e6] hover:bg-[#3880f6] border border-white/60 active:brightness-90 text-white shadow-inner"
          >
            {isMaximized ? <Copy size={10} strokeWidth={2.5} /> : <Square size={10} strokeWidth={2.5} />}
          </button>

          {/* Fechar */}
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="w-5 h-5 flex items-center justify-center rounded-[3px] bg-gradient-to-b from-[#e81123] to-[#c4101d] hover:brightness-110 border border-white/60 active:brightness-90 text-white shadow-inner"
          >
            <X size={12} strokeWidth={3} />
          </button>
        </div>
      </div>

      {/* ── BARRA DE MENUS RETRÔ ── */}
      {menuItems.length > 0 && (
        <div className="bg-[#ece9d8] border-b border-[#d4d0c8] px-2 py-0.5 flex items-center gap-3 text-[11px] text-[#222222] shrink-0 font-sans">
          {menuItems.map(item => (
            <span
              key={item}
              className="px-1.5 py-0.5 hover:bg-[#316ac5] hover:text-white rounded-[2px] cursor-default transition-colors"
            >
              {item}
            </span>
          ))}
        </div>
      )}

      {/* ── CORPO DA JANELA ── */}
      <div className="flex-1 bg-white overflow-auto relative font-sans text-[#202124]">
        {children}
      </div>

      {/* ── BARRA DE STATUS ── */}
      {statusBarText && (
        <div className="bg-[#ece9d8] border-t border-[#d4d0c8] px-2 py-0.5 flex items-center justify-between text-[11px] text-[#555555] shrink-0 font-sans">
          <span className="truncate">{statusBarText}</span>
          <div className="w-2.5 h-2.5 flex flex-col justify-end items-end gap-0.5 opacity-60">
            <div className="w-1 h-0.5 bg-gray-600"></div>
            <div className="w-2 h-0.5 bg-gray-600"></div>
          </div>
        </div>
      )}
    </div>
  );
}
