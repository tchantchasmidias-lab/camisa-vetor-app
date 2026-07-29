'use client';

/**
 * CanvasWorkspace — Área central do canvas de edição.
 *
 * Todos os 4 canvas Fabric.js são mantidos montados (display:none nos inativos)
 * para preservar o estado de cada parte enquanto o usuário navega pelas tabs.
 *
 * As tabs de navegação foram movidas para a StudioTopBar (barra superior).
 * A toolbox foi movida para o VerticalToolbox (coluna lateral esquerda).
 */

import dynamic from 'next/dynamic';
import { useRef } from 'react';
import { useStudio, PARTS, type CanvasPart } from './StudioContext';
import type { FabricPartCanvasHandle } from './FabricPartCanvas';

// Import dinâmico com SSR desativado (Fabric.js depende de window/document)
const FabricPartCanvas = dynamic(() => import('./FabricPartCanvas'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center w-full h-full">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent
                        rounded-full animate-spin" />
        <span className="text-xs text-gray-500">Carregando editor...</span>
      </div>
    </div>
  ),
});

export default function CanvasWorkspace() {
  const { activePart } = useStudio();
  const canvasHandles = useRef<Partial<Record<CanvasPart, FabricPartCanvasHandle>>>({});

  return (
    // Ocupa todo o espaço disponível, com scroll se o canvas for maior que a área
    <div className="flex-1 overflow-auto bg-[#111418] flex items-start justify-center p-8">
      {PARTS.map((p) => (
        <div
          key={p.id}
          // Todos os canvas ficam montados — apenas visibilidade muda
          style={{ display: activePart === p.id ? 'block' : 'none' }}
        >
          <FabricPartCanvas
            part={p.id}
            ref={(el) => {
              if (el) canvasHandles.current[p.id] = el;
            }}
          />
        </div>
      ))}
    </div>
  );
}

export type { FabricPartCanvasHandle };
