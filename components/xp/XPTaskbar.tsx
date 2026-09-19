'use client';

import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Shield, Wifi } from 'lucide-react';

export interface TaskbarWindowItem {
  id: string;
  title: string;
  icon?: React.ReactNode;
  isOpen: boolean;
  isMinimized: boolean;
  isActive: boolean;
}

interface XPTaskbarProps {
  isStartOpen: boolean;
  onToggleStart: () => void;
  windows: TaskbarWindowItem[];
  onWindowClick: (id: string) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onPlayClick: () => void;
}

export default function XPTaskbar({
  isStartOpen,
  onToggleStart,
  windows,
  onWindowClick,
  isMuted,
  onToggleMute,
  onPlayClick,
}: XPTaskbarProps) {
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed bottom-0 left-0 right-0 h-9 bg-gradient-to-b from-[#245edb] via-[#3882ec] to-[#194bb0] z-[9995] flex items-center justify-between border-t border-[#468df8] shadow-[0_-2px_10px_rgba(0,0,0,0.3)] select-none font-sans">
      {/* ── LADO ESQUERDO: BOTÃO INICIAR E JANELAS ── */}
      <div className="flex items-center h-full overflow-hidden flex-1">
        {/* Botão Iniciar Clássico Verde Luna */}
        <button
          id="xp-start-button"
          onClick={() => {
            onPlayClick();
            onToggleStart();
          }}
          className={`h-full px-3.5 flex items-center gap-2 rounded-r-2xl font-black italic tracking-wide text-white text-[13px] shadow-[2px_0_6px_rgba(0,0,0,0.4)] transition-all cursor-pointer ${
            isStartOpen
              ? 'bg-gradient-to-b from-[#28631c] to-[#388523] brightness-90 shadow-inner'
              : 'bg-gradient-to-b from-[#4ca526] via-[#3d911e] to-[#2b7513] hover:brightness-110'
          }`}
        >
          {/* Logo 4 cores do Windows XP */}
          <div className="grid grid-cols-2 gap-0.5 w-3.5 h-3.5 rotate-12 shadow-sm">
            <div className="bg-[#ff4b4b] rounded-[1px]" />
            <div className="bg-[#4bc64b] rounded-[1px]" />
            <div className="bg-[#4b8aff] rounded-[1px]" />
            <div className="bg-[#ffc64b] rounded-[1px]" />
          </div>
          <span className="drop-shadow-[1px_1px_1px_rgba(0,0,0,0.8)]">iniciar</span>
        </button>

        {/* Separador sutil */}
        <div className="w-1.5 h-full bg-gradient-to-r from-black/20 to-transparent" />

        {/* Lista de Janelas Abertas na Barra de Tarefas */}
        <div className="flex items-center gap-1 px-2 h-full overflow-x-auto no-scrollbar flex-1">
          {windows
            .filter(w => w.isOpen)
            .map(w => {
              const isPressed = w.isActive && !w.isMinimized;
              return (
                <button
                  key={w.id}
                  onClick={() => {
                    onPlayClick();
                    onWindowClick(w.id);
                  }}
                  className={`h-7 max-w-[170px] min-w-[100px] px-2 flex items-center gap-1.5 rounded-[3px] text-xs font-medium text-white transition-all cursor-pointer truncate ${
                    isPressed
                      ? 'bg-[#194bb0] shadow-[inset_1px_1px_2px_rgba(0,0,0,0.6)] border border-[#002f82]'
                      : 'bg-[#3b80eb] hover:bg-[#4d91fc] border border-white/20 shadow-sm'
                  }`}
                  title={w.title}
                >
                  {w.icon && <span className="w-4 h-4 shrink-0 flex items-center justify-center">{w.icon}</span>}
                  <span className="truncate text-[11px] drop-shadow-[1px_1px_0_rgba(0,0,0,0.7)]">
                    {w.title}
                  </span>
                </button>
              );
            })}
        </div>
      </div>

      {/* ── LADO DIREITO: ÁREA DE NOTIFICAÇÃO (SYSTEM TRAY) ── */}
      <div className="h-full bg-gradient-to-b from-[#0f4cc4] to-[#0c3da1] border-l-2 border-[#1242a4] px-3 flex items-center gap-2.5 text-white shadow-inner shrink-0">
        {/* Ícone de Som / Mudo */}
        <button
          onClick={() => {
            onPlayClick();
            onToggleMute();
          }}
          className="hover:scale-110 transition-transform cursor-pointer text-white"
          title={isMuted ? 'Áudio desativado (Clique para ativar sons do XP)' : 'Áudio ativado (Clique para silenciar)'}
        >
          {isMuted ? <VolumeX size={15} className="text-red-300" /> : <Volume2 size={15} />}
        </button>

        {/* Ícone de Rede */}
        <div title="Conectado à Internet (camisavetor.com.br)">
          <Wifi size={13} className="text-blue-200" />
        </div>

        {/* Escudo de Segurança */}
        <div title="Proteção de Compra Camisa Vetor Ativa">
          <Shield size={13} className="text-emerald-300" />
        </div>

        {/* Relógio em Tempo Real */}
        <div className="text-[11px] font-mono tracking-tighter text-white pl-1 border-l border-white/20">
          {timeStr || '12:00'}
        </div>
      </div>
    </div>
  );
}
