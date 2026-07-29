'use client';

/**
 * StudioTopBar — Barra superior do Studio.
 *
 * Contém apenas:
 *  • Logo / marca do Studio (esquerda)
 *  • Tabs de vista: Frente | Costas | Manga D | Manga E (centro)
 *  • Ações: Salvar · Exportar Pacote (direita)
 *
 * As ferramentas de edição foram movidas para a VerticalToolbox lateral.
 */

import { useState } from 'react';
import Image from 'next/image';
import { useStudio, PARTS } from './StudioContext';

interface StudioTopBarProps {
  projectName: string;
  onProjectNameChange: (name: string) => void;
  onExport: () => void;
  isExporting?: boolean;
}

export default function StudioTopBar({
  projectName,
  onProjectNameChange,
  onExport,
  isExporting,
}: StudioTopBarProps) {
  const { activePart, setActivePart } = useStudio();
  const [editingName, setEditingName] = useState(false);

  return (
    <header
      className="flex items-center h-12 px-3 gap-2 flex-shrink-0
                 bg-[#1e2128] border-b border-white/[0.06] select-none z-20"
    >
      {/* ── Logo ── */}
      <div className="flex items-center gap-2 flex-shrink-0 mr-1">
        <div className="w-7 h-7 rounded-lg overflow-hidden flex items-center justify-center
                        bg-[#111418] border border-white/10">
          <Image
            src="/logo-icon.png"
            alt="Camisa Vetor Studio"
            width={28}
            height={28}
            className="object-contain"
            priority
          />
        </div>
        {/* Nome do projeto editável */}
        {editingName ? (
          <input
            autoFocus
            value={projectName}
            onChange={e => onProjectNameChange(e.target.value)}
            onBlur={() => setEditingName(false)}
            onKeyDown={e => e.key === 'Enter' && setEditingName(false)}
            className="bg-white/10 text-white text-xs px-2 py-1 rounded-md
                       outline-none border border-orange-500/50 w-36"
          />
        ) : (
          <button
            onClick={() => setEditingName(true)}
            className="text-xs text-gray-300 hover:text-white
                       transition-colors px-1 py-0.5 rounded max-w-[120px] truncate"
          >
            {projectName}
          </button>
        )}
      </div>

      {/* ── Divisor ── */}
      <div className="h-6 w-px bg-white/10 flex-shrink-0" />

      {/* ── Tabs de vista (centro) ── */}
      <nav className="flex items-center gap-0.5 flex-1 justify-center">
        {PARTS.map(part => {
          const isActive = activePart === part.id;
          return (
            <button
              key={part.id}
              onClick={() => setActivePart(part.id)}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                text-xs font-medium transition-all duration-150
                ${isActive
                  ? 'bg-orange-500/20 text-orange-300 ring-1 ring-orange-500/40'
                  : 'text-gray-500 hover:text-gray-200 hover:bg-white/8'
                }
              `}
            >
              <span className="text-sm leading-none">{part.icon}</span>
              {part.label}
            </button>
          );
        })}
      </nav>

      {/* ── Divisor ── */}
      <div className="h-6 w-px bg-white/10 flex-shrink-0" />

      {/* ── Ações (direita) ── */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          className="text-xs text-gray-500 hover:text-gray-200 px-2 py-1.5
                     rounded-lg hover:bg-white/8 transition-all duration-150"
        >
          💾 Salvar
        </button>

        <button
          onClick={onExport}
          disabled={isExporting}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold
                     bg-gradient-to-r from-orange-500 to-orange-600
                     hover:from-orange-400 hover:to-orange-500
                     disabled:opacity-50 disabled:cursor-not-allowed
                     text-white shadow-md shadow-orange-500/20
                     transition-all duration-200 active:scale-[0.97]"
        >
          {isExporting ? (
            <>
              <span className="w-3 h-3 border border-white/40 border-t-white
                               rounded-full animate-spin inline-block" />
              Exportando...
            </>
          ) : (
            '📦 Exportar Pacote'
          )}
        </button>
      </div>
    </header>
  );
}
