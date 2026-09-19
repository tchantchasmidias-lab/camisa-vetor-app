'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  Folder, Image as ImageIcon, ShoppingCart, FileText, 
  HardDrive, Globe 
} from 'lucide-react';
import type { Product } from '@/components/HomeClient';
import { useXPSounds } from '@/components/xp/useXPSounds';
import XPTaskbar, { TaskbarWindowItem } from '@/components/xp/XPTaskbar';
import XPStartMenu from '@/components/xp/XPStartMenu';
import XPWindow from '@/components/xp/XPWindow';
import XPExplorer from '@/components/xp/XPExplorer';
import XPImageViewer from '@/components/xp/XPImageViewer';
import XPCartWindow from '@/components/xp/XPCartWindow';
import XPNotepad from '@/components/xp/XPNotepad';
import XPShutdownDialog from '@/components/xp/XPShutdownDialog';

interface XPDesktopClientProps {
  initialProducts: Product[];
}

interface WindowState {
  id: string;
  title: string;
  icon: React.ReactNode;
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
}

export default function XPDesktopClient({ initialProducts }: XPDesktopClientProps) {
  const sounds = useXPSounds();

  // Estado das Janelas do Desktop
  const [windows, setWindows] = useState<Record<string, WindowState>>({
    explorer: {
      id: 'explorer',
      title: 'Catálogo de Vetores - C:\\CamisaVetor\\Catalogo',
      icon: <Folder size={14} className="text-[#f5a623]" />,
      isOpen: true,
      isMinimized: false,
      isMaximized: false,
      zIndex: 10,
    },
    viewer: {
      id: 'viewer',
      title: 'Visualizador de Imagens do Windows',
      icon: <ImageIcon size={14} className="text-purple-600" />,
      isOpen: false,
      isMinimized: false,
      isMaximized: false,
      zIndex: 11,
    },
    cart: {
      id: 'cart',
      title: 'Carrinho de Compras - Camisa Vetor',
      icon: <ShoppingCart size={14} className="text-[#fe7302]" />,
      isOpen: false,
      isMinimized: false,
      isMaximized: false,
      zIndex: 12,
    },
    notepad: {
      id: 'notepad',
      title: 'LEIAME.txt - Bloco de notas',
      icon: <FileText size={14} className="text-sky-600" />,
      isOpen: false,
      isMinimized: false,
      isMaximized: false,
      zIndex: 13,
    },
  });

  const [activeWindowId, setActiveWindowId] = useState<string | null>('explorer');
  const [maxZIndex, setMaxZIndex] = useState(20);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(initialProducts[0] || null);
  const [isStartOpen, setIsStartOpen] = useState(false);
  const [isShutdownOpen, setIsShutdownOpen] = useState(false);
  const [selectedDesktopIcon, setSelectedDesktopIcon] = useState<string | null>(null);
  const [hasPlayedStartup, setHasPlayedStartup] = useState(false);

  // Toca o acorde de inicialização na primeira interação do usuário (respeitando autoplay policy)
  useEffect(() => {
    const handleFirstInteraction = () => {
      if (!hasPlayedStartup) {
        sounds.playStartup();
        setHasPlayedStartup(true);
      }
      window.removeEventListener('pointerdown', handleFirstInteraction);
    };

    window.addEventListener('pointerdown', handleFirstInteraction);
    return () => {
      window.removeEventListener('pointerdown', handleFirstInteraction);
    };
  }, [hasPlayedStartup, sounds]);

  // Foco de Janela
  const focusWindow = useCallback((id: string) => {
    setMaxZIndex(prev => {
      const nextZ = prev + 1;
      setWindows(w => ({
        ...w,
        [id]: {
          ...w[id],
          isOpen: true,
          isMinimized: false,
          zIndex: nextZ,
        },
      }));
      setActiveWindowId(id);
      return nextZ;
    });
  }, []);

  // Abrir ou Restaurar Janela
  const openWindow = useCallback((id: string) => {
    sounds.playClick();
    focusWindow(id);
  }, [focusWindow, sounds]);

  // Fechar Janela
  const closeWindow = useCallback((id: string) => {
    sounds.playClick();
    setWindows(w => ({
      ...w,
      [id]: {
        ...w[id],
        isOpen: false,
        isMinimized: false,
      },
    }));
    if (activeWindowId === id) {
      setActiveWindowId(null);
    }
  }, [activeWindowId, sounds]);

  // Minimizar Janela
  const minimizeWindow = useCallback((id: string) => {
    sounds.playClick();
    setWindows(w => ({
      ...w,
      [id]: {
        ...w[id],
        isMinimized: true,
      },
    }));
    if (activeWindowId === id) {
      setActiveWindowId(null);
    }
  }, [activeWindowId, sounds]);

  // Maximizar / Restaurar Janela
  const toggleMaximizeWindow = useCallback((id: string) => {
    sounds.playClick();
    setWindows(w => ({
      ...w,
      [id]: {
        ...w[id],
        isMaximized: !w[id].isMaximized,
      },
    }));
    focusWindow(id);
  }, [focusWindow, sounds]);

  // Clique na Barra de Tarefas
  const handleTaskbarClick = useCallback((id: string) => {
    const target = windows[id];
    if (!target) return;

    if (activeWindowId === id && !target.isMinimized) {
      minimizeWindow(id);
    } else {
      focusWindow(id);
    }
  }, [activeWindowId, windows, minimizeWindow, focusWindow]);

  // Abrir produto no Visualizador
  const handleOpenProduct = useCallback((product: Product) => {
    setSelectedProduct(product);
    setWindows(w => ({
      ...w,
      viewer: {
        ...w.viewer,
        title: `${product.name} — Visualizador de Imagens`,
        isOpen: true,
        isMinimized: false,
      },
    }));
    focusWindow('viewer');
  }, [focusWindow]);

  // Reiniciar Desktop
  const handleRestart = useCallback(() => {
    setWindows({
      explorer: {
        id: 'explorer',
        title: 'Catálogo de Vetores - C:\\CamisaVetor\\Catalogo',
        icon: <Folder size={14} className="text-[#f5a623]" />,
        isOpen: true,
        isMinimized: false,
        isMaximized: false,
        zIndex: 10,
      },
      viewer: {
        id: 'viewer',
        title: 'Visualizador de Imagens do Windows',
        icon: <ImageIcon size={14} className="text-purple-600" />,
        isOpen: false,
        isMinimized: false,
        isMaximized: false,
        zIndex: 11,
      },
      cart: {
        id: 'cart',
        title: 'Carrinho de Compras - Camisa Vetor',
        icon: <ShoppingCart size={14} className="text-[#fe7302]" />,
        isOpen: false,
        isMinimized: false,
        isMaximized: false,
        zIndex: 12,
      },
      notepad: {
        id: 'notepad',
        title: 'LEIAME.txt - Bloco de notas',
        icon: <FileText size={14} className="text-sky-600" />,
        isOpen: false,
        isMinimized: false,
        isMaximized: false,
        zIndex: 13,
      },
    });
    setActiveWindowId('explorer');
    sounds.playStartup();
  }, [sounds]);

  const taskbarItems: TaskbarWindowItem[] = Object.values(windows).map(w => ({
    id: w.id,
    title: w.title,
    icon: w.icon,
    isOpen: w.isOpen,
    isMinimized: w.isMinimized,
    isActive: activeWindowId === w.id,
  }));

  return (
    <div 
      className="fixed inset-0 w-screen h-screen overflow-hidden select-none font-sans"
      onClick={() => setSelectedDesktopIcon(null)}
    >
      {/* ── WALLPAPER BLISS CLÁSSICO DO WINDOWS XP (CSS/SVG ARTÍSTICO) ── */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Céu Azul Radiante com Gradiente */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#1b71cc] via-[#4da0e8] to-[#99ccff]" />

        {/* Nuvens Cumulus Realistas */}
        <div className="absolute top-6 left-1/4 w-96 h-36 bg-white/40 rounded-full blur-2xl" />
        <div className="absolute top-12 left-1/3 w-80 h-28 bg-white/60 rounded-full blur-xl" />
        <div className="absolute top-16 right-1/4 w-[480px] h-32 bg-white/50 rounded-full blur-2xl" />
        <div className="absolute top-24 right-1/3 w-[360px] h-24 bg-white/70 rounded-full blur-xl" />

        {/* Colinas Verdes Onduladas (Bliss Hills) */}
        <svg
          viewBox="0 0 1440 800"
          preserveAspectRatio="none"
          className="absolute bottom-0 w-full h-[65%] object-cover"
        >
          <defs>
            <linearGradient id="hillBack" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4c9a27" />
              <stop offset="50%" stopColor="#6ebc3b" />
              <stop offset="100%" stopColor="#3b7a1d" />
            </linearGradient>
            <linearGradient id="hillFront" x1="20%" y1="0%" x2="80%" y2="100%">
              <stop offset="0%" stopColor="#7ecb38" />
              <stop offset="35%" stopColor="#63b328" />
              <stop offset="70%" stopColor="#4e991e" />
              <stop offset="100%" stopColor="#326c12" />
            </linearGradient>
            <radialGradient id="sunGlow" cx="40%" cy="30%" r="60%">
              <stop offset="0%" stopColor="#a3e658" stopOpacity="0.8" />
              <stop offset="60%" stopColor="#6ebc3b" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#4c9a27" stopOpacity="0" />
            </radialGradient>
          </defs>

          <path
            d="M 0 450 Q 360 280 720 380 T 1440 320 L 1440 800 L 0 800 Z"
            fill="url(#hillBack)"
          />

          <path
            d="M 0 520 Q 320 220 780 430 T 1440 400 L 1440 800 L 0 800 Z"
            fill="url(#hillFront)"
          />

          <path
            d="M 120 480 Q 420 240 760 410 T 1320 420 L 1320 800 L 120 800 Z"
            fill="url(#sunGlow)"
          />
        </svg>
      </div>

      {/* ── ÍCONES DA ÁREA DE TRABALHO (DESKTOP ICONS) ── */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-5">
        {/* 1. Meu Computador / Catálogo */}
        <div
          onClick={e => { e.stopPropagation(); sounds.playClick(); setSelectedDesktopIcon('computer'); }}
          onDoubleClick={e => { e.stopPropagation(); openWindow('explorer'); }}
          className={`flex flex-col items-center w-20 p-1.5 rounded cursor-pointer transition-colors ${
            selectedDesktopIcon === 'computer'
              ? 'bg-[#316ac5]/60 border border-[#316ac5]'
              : 'hover:bg-white/20 border border-transparent'
          }`}
        >
          <div className="w-10 h-10 rounded bg-gradient-to-b from-blue-100 to-blue-200 border border-blue-400 flex items-center justify-center text-blue-600 shadow-md">
            <HardDrive size={22} />
          </div>
          <span className="text-white text-[11px] font-bold text-center mt-1 leading-tight drop-shadow-[1px_1px_1px_rgba(0,0,0,0.9)]">
            Meu Computador
          </span>
        </div>

        {/* 2. Catálogo de Vetores */}
        <div
          onClick={e => { e.stopPropagation(); sounds.playClick(); setSelectedDesktopIcon('catalog'); }}
          onDoubleClick={e => { e.stopPropagation(); openWindow('explorer'); }}
          className={`flex flex-col items-center w-20 p-1.5 rounded cursor-pointer transition-colors ${
            selectedDesktopIcon === 'catalog'
              ? 'bg-[#316ac5]/60 border border-[#316ac5]'
              : 'hover:bg-white/20 border border-transparent'
          }`}
        >
          <div className="w-10 h-10 rounded bg-amber-100 border border-amber-400 flex items-center justify-center text-[#f5a623] shadow-md">
            <Folder size={24} className="fill-[#f5a623]" />
          </div>
          <span className="text-white text-[11px] font-bold text-center mt-1 leading-tight drop-shadow-[1px_1px_1px_rgba(0,0,0,0.9)]">
            Catálogo de Camisas
          </span>
        </div>

        {/* 3. Visualizador de Imagens */}
        <div
          onClick={e => { e.stopPropagation(); sounds.playClick(); setSelectedDesktopIcon('viewer'); }}
          onDoubleClick={e => { e.stopPropagation(); openWindow('viewer'); }}
          className={`flex flex-col items-center w-20 p-1.5 rounded cursor-pointer transition-colors ${
            selectedDesktopIcon === 'viewer'
              ? 'bg-[#316ac5]/60 border border-[#316ac5]'
              : 'hover:bg-white/20 border border-transparent'
          }`}
        >
          <div className="w-10 h-10 rounded bg-purple-100 border border-purple-400 flex items-center justify-center text-purple-600 shadow-md">
            <ImageIcon size={22} />
          </div>
          <span className="text-white text-[11px] font-bold text-center mt-1 leading-tight drop-shadow-[1px_1px_1px_rgba(0,0,0,0.9)]">
            Visualizador de Estampas
          </span>
        </div>

        {/* 4. Carrinho de Compras */}
        <div
          onClick={e => { e.stopPropagation(); sounds.playClick(); setSelectedDesktopIcon('cart'); }}
          onDoubleClick={e => { e.stopPropagation(); openWindow('cart'); }}
          className={`flex flex-col items-center w-20 p-1.5 rounded cursor-pointer transition-colors ${
            selectedDesktopIcon === 'cart'
              ? 'bg-[#316ac5]/60 border border-[#316ac5]'
              : 'hover:bg-white/20 border border-transparent'
          }`}
        >
          <div className="w-10 h-10 rounded bg-orange-100 border border-orange-400 flex items-center justify-center text-[#fe7302] shadow-md">
            <ShoppingCart size={22} />
          </div>
          <span className="text-white text-[11px] font-bold text-center mt-1 leading-tight drop-shadow-[1px_1px_1px_rgba(0,0,0,0.9)]">
            Carrinho de Compras
          </span>
        </div>

        {/* 5. Bloco de Notas (LEIAME.txt) */}
        <div
          onClick={e => { e.stopPropagation(); sounds.playClick(); setSelectedDesktopIcon('notepad'); }}
          onDoubleClick={e => { e.stopPropagation(); openWindow('notepad'); }}
          className={`flex flex-col items-center w-20 p-1.5 rounded cursor-pointer transition-colors ${
            selectedDesktopIcon === 'notepad'
              ? 'bg-[#316ac5]/60 border border-[#316ac5]'
              : 'hover:bg-white/20 border border-transparent'
          }`}
        >
          <div className="w-10 h-10 rounded bg-sky-100 border border-sky-400 flex items-center justify-center text-sky-600 shadow-md">
            <FileText size={22} />
          </div>
          <span className="text-white text-[11px] font-bold text-center mt-1 leading-tight drop-shadow-[1px_1px_1px_rgba(0,0,0,0.9)]">
            LEIAME.txt
          </span>
        </div>

        {/* 6. Voltar para Loja Moderna */}
        <Link
          href="/"
          onClick={() => sounds.playClick()}
          className="flex flex-col items-center w-20 p-1.5 rounded cursor-pointer hover:bg-white/20 border border-transparent transition-colors group"
        >
          <div className="w-10 h-10 rounded-full bg-emerald-100 border border-emerald-400 flex items-center justify-center text-emerald-600 shadow-md group-hover:scale-105 transition-transform">
            <Globe size={22} />
          </div>
          <span className="text-white text-[11px] font-bold text-center mt-1 leading-tight drop-shadow-[1px_1px_1px_rgba(0,0,0,0.9)]">
            Loja Oficial Moderna
          </span>
        </Link>
      </div>

      {/* ── JANELA 1: WINDOWS EXPLORER (CATÁLOGO DE VETORES) ── */}
      <XPWindow
        id="explorer"
        title={windows.explorer.title}
        icon={windows.explorer.icon}
        isOpen={windows.explorer.isOpen}
        isMinimized={windows.explorer.isMinimized}
        isMaximized={windows.explorer.isMaximized}
        isActive={activeWindowId === 'explorer'}
        zIndex={windows.explorer.zIndex}
        onClose={() => closeWindow('explorer')}
        onMinimize={() => minimizeWindow('explorer')}
        onMaximize={() => toggleMaximizeWindow('explorer')}
        onFocus={() => focusWindow('explorer')}
        initialPosition={{ x: 100, y: 40 }}
        initialSize={{ width: 840, height: 540 }}
        statusBarText={`${initialProducts.length} objeto(s) no catálogo • Download Imediato`}
      >
        <XPExplorer
          products={initialProducts}
          onOpenProduct={handleOpenProduct}
          onPlayClick={sounds.playClick}
        />
      </XPWindow>

      {/* ── JANELA 2: VISUALIZADOR DE IMAGENS E FAX DO WINDOWS ── */}
      <XPWindow
        id="viewer"
        title={windows.viewer.title}
        icon={windows.viewer.icon}
        isOpen={windows.viewer.isOpen}
        isMinimized={windows.viewer.isMinimized}
        isMaximized={windows.viewer.isMaximized}
        isActive={activeWindowId === 'viewer'}
        zIndex={windows.viewer.zIndex}
        onClose={() => closeWindow('viewer')}
        onMinimize={() => minimizeWindow('viewer')}
        onMaximize={() => toggleMaximizeWindow('viewer')}
        onFocus={() => focusWindow('viewer')}
        initialPosition={{ x: 160, y: 70 }}
        initialSize={{ width: 780, height: 520 }}
        statusBarText="Visualizador de Imagens e Fax do Windows XP • Zoom 100%"
      >
        <XPImageViewer
          product={selectedProduct}
          onAddToCartSuccess={sounds.playNotify}
          onOpenCart={() => openWindow('cart')}
          onPlayClick={sounds.playClick}
        />
      </XPWindow>

      {/* ── JANELA 3: CARRINHO DE COMPRAS ── */}
      <XPWindow
        id="cart"
        title={windows.cart.title}
        icon={windows.cart.icon}
        isOpen={windows.cart.isOpen}
        isMinimized={windows.cart.isMinimized}
        isMaximized={windows.cart.isMaximized}
        isActive={activeWindowId === 'cart'}
        zIndex={windows.cart.zIndex}
        onClose={() => closeWindow('cart')}
        onMinimize={() => minimizeWindow('cart')}
        onMaximize={() => toggleMaximizeWindow('cart')}
        onFocus={() => focusWindow('cart')}
        initialPosition={{ x: 220, y: 100 }}
        initialSize={{ width: 560, height: 440 }}
        statusBarText="Conexão SSL 256-bit • Checkout Seguro Camisa Vetor"
      >
        <XPCartWindow
          onPlayClick={sounds.playClick}
          onPlayNotify={sounds.playNotify}
          onClose={() => closeWindow('cart')}
        />
      </XPWindow>

      {/* ── JANELA 4: BLOCO DE NOTAS (README.TXT) ── */}
      <XPWindow
        id="notepad"
        title={windows.notepad.title}
        icon={windows.notepad.icon}
        isOpen={windows.notepad.isOpen}
        isMinimized={windows.notepad.isMinimized}
        isMaximized={windows.notepad.isMaximized}
        isActive={activeWindowId === 'notepad'}
        zIndex={windows.notepad.zIndex}
        onClose={() => closeWindow('notepad')}
        onMinimize={() => minimizeWindow('notepad')}
        onMaximize={() => toggleMaximizeWindow('notepad')}
        onFocus={() => focusWindow('notepad')}
        initialPosition={{ x: 280, y: 120 }}
        initialSize={{ width: 520, height: 400 }}
        menuItems={['Arquivo', 'Editar', 'Formatar', 'Exibir', 'Ajuda']}
        statusBarText="Ln 1, Col 1 • UTF-8 • Windows (CRLF)"
      >
        <XPNotepad />
      </XPWindow>

      {/* ── DIÁLOGO DE DESLIGAR O COMPUTADOR ── */}
      <XPShutdownDialog
        isOpen={isShutdownOpen}
        onClose={() => setIsShutdownOpen(false)}
        onRestart={handleRestart}
        onPlayClick={sounds.playClick}
        onPlayShutdown={sounds.playShutdown}
      />

      {/* ── MENU INICIAR RETRÔ ── */}
      <XPStartMenu
        isOpen={isStartOpen}
        onClose={() => setIsStartOpen(false)}
        onOpenExplorer={() => openWindow('explorer')}
        onOpenViewer={() => openWindow('viewer')}
        onOpenCart={() => openWindow('cart')}
        onOpenNotepad={() => openWindow('notepad')}
        onOpenShutdown={() => setIsShutdownOpen(true)}
        onPlayClick={sounds.playClick}
      />

      {/* ── BARRA DE TAREFAS INFERIOR (TASKBAR) ── */}
      <XPTaskbar
        isStartOpen={isStartOpen}
        onToggleStart={() => setIsStartOpen(prev => !prev)}
        windows={taskbarItems}
        onWindowClick={handleTaskbarClick}
        isMuted={sounds.isMuted}
        onToggleMute={sounds.toggleMute}
        onPlayClick={sounds.playClick}
      />
    </div>
  );
}
