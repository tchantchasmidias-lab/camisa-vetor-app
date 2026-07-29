'use client';

/**
 * Studio — Página principal do editor vetorial.
 *
 * Layout final (100vw × 100vh, overflow hidden):
 *
 * ┌────────────────── StudioTopBar (h-12) ──────────────────────┐
 * │  [CV] Nome   [Frente][Costas][Manga D][Manga E]   💾 📦      │
 * ├──┬───────────────────────────────────┬──────┬───────────────┤
 * │  │                                   │      │               │
 * │🖱│                                   │      │               │
 * │T │        CanvasWorkspace            │Right │  ThreeDMockup │
 * │▭ │        (Fabric.js canvas)         │Panel │  (Three.js)   │
 * │○ │                                   │      │               │
 * │↑ │                                   │      │               │
 * │  │                                   │      │               │
 * └──┴───────────────────────────────────┴──────┴───────────────┘
 *  ↑
 *  VerticalToolbox (w-12)
 */

import dynamic from 'next/dynamic';
import { useState, useCallback } from 'react';
import { StudioProvider } from '@/components/studio/StudioContext';
import StudioTopBar from '@/components/studio/StudioToolbar';
import RightPanel from '@/components/studio/RightPanel';

// ─── Imports dinâmicos (sem SSR — dependem de window/document) ───────────────

const CanvasWorkspace = dynamic(
  () => import('@/components/studio/CanvasWorkspace'),
  { ssr: false }
);

const ThreeDMockup = dynamic(
  () => import('@/components/studio/ThreeDMockup'),
  { ssr: false }
);

const VerticalToolbox = dynamic(
  () => import('@/components/studio/VerticalToolbox'),
  { ssr: false }
);

const AssetDrawer = dynamic(
  () => import('@/components/studio/AssetDrawer'),
  { ssr: false }
);

// ─── Página ───────────────────────────────────────────────────────────────────

export default function StudioPage() {
  const [isExporting, setIsExporting] = useState(false);
  const [projectName, setProjectName] = useState('Nova Estampa');

  const handleMockupScreenshot = useCallback((blob: Blob) => {
    // Por enquanto só logamos; na v2 integraremos ao pacote ZIP
    console.log('[Studio] Mockup screenshot capturado:', blob.size, 'bytes');
  }, []);

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      // Captura o ângulo atual do 3D
      (window as Window & { __studioCapture?: () => void }).__studioCapture?.();
      // TODO: coletar dataURLs de alta resolução + chamar /studio/api/export
      await new Promise(r => setTimeout(r, 1500));
      alert('Exportação concluída! (integração com API em desenvolvimento)');
    } catch (err) {
      console.error('[Studio] Erro na exportação:', err);
    } finally {
      setIsExporting(false);
    }
  }, []);

  return (
    <StudioProvider>
      {/*
        Garante 100vw × 100vh absolutos, sem qualquer herança do layout global.
        O `isolation: isolate` evita que z-indexes do e-commerce vazem para cá.
      */}
      <div
        className="fixed inset-0 flex flex-col bg-[#111418] text-white overflow-hidden"
        style={{ isolation: 'isolate' }}
      >
        {/* ── 1. Barra superior: logo + tabs de vista + ações ── */}
        <StudioTopBar
          projectName={projectName}
          onProjectNameChange={setProjectName}
          onExport={handleExport}
          isExporting={isExporting}
        />

        {/* ── 2. Área de trabalho principal ── */}
        <div className="flex flex-1 overflow-hidden min-h-0">

          {/* ── 2a. Toolbox vertical estilo CorelDRAW ── */}
          <VerticalToolbox />

          {/* ── 2a2. Gaveta de Assets (abre ao lado da toolbox) ── */}
          <AssetDrawer />

          {/* ── 2b. Canvas de edição 2D (Fabric.js) ── */}
          <div className="flex-1 flex flex-col overflow-hidden min-w-0">
            <CanvasWorkspace />
          </div>

          {/* ── Divisor visual ── */}
          <div className="w-px bg-white/[0.04] flex-shrink-0" />

          {/* ── 2c. Viewer 3D (Three.js) ── */}
          <div className="w-[380px] flex-shrink-0 flex flex-col bg-[#0d1014]">
            <div className="flex items-center justify-between px-3 py-2
                            bg-[#1e2128] border-b border-white/[0.06] flex-shrink-0">
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">
                Preview 3D
              </span>
              <span className="flex items-center gap-1 text-[10px] text-emerald-500">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                ao vivo
              </span>
            </div>
            <div className="flex-1 min-h-0">
              <ThreeDMockup onScreenshot={handleMockupScreenshot} />
            </div>
          </div>

          {/* ── 2d. Painel de propriedades (direito) ── */}
          <RightPanel />
        </div>
      </div>
    </StudioProvider>
  );
}
