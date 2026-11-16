'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { X, Download } from 'lucide-react';
import { safeLocalStorage } from '@/lib/safeStorage';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISSED_KEY = 'cv_pwa_banner_dismissed';

export default function PwaInstallBanner() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [isMobile, setIsMobile] = useState(true);
  const [footerInView, setFooterInView] = useState(false);

  useEffect(() => {
    // Determina se é dispositivo móvel
    setIsMobile(window.innerWidth <= 768);

    // Observa visibilidade do rodapé para recolher o banner e evitar sobreposição
    let observer: IntersectionObserver | null = null;
    const footer = document.querySelector('footer');
    if (footer && typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(
        ([entry]) => {
          setFooterInView(entry.isIntersecting);
        },
        { rootMargin: '0px 0px 40px 0px', threshold: 0 }
      );
      observer.observe(footer);
    }

    // Não mostra se já foi dispensado
    if (safeLocalStorage.getItem(DISMISSED_KEY)) return;

    // Não mostra se já está instalado (modo standalone)
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    const setupPrompt = (e: BeforeInstallPromptEvent) => {
      setPrompt(e);
      // Mostra o banner após 3 segundos
      setTimeout(() => setVisible(true), 3000);
    };

    const handler = (e: Event) => {
      e.preventDefault();
      setupPrompt(e as BeforeInstallPromptEvent);
    };

    const checkGlobalPrompt = () => {
      if ((window as any).deferredPrompt) {
        setupPrompt((window as any).deferredPrompt);
      }
    };

    checkGlobalPrompt();

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('cv-pwa-prompt-available', checkGlobalPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('cv-pwa-prompt-available', checkGlobalPrompt);
      if (observer) observer.disconnect();
    };
  }, []);

  const handleInstall = async () => {
    if (!prompt) return;
    setInstalling(true);
    await prompt.prompt();
    const choice = await prompt.userChoice;
    if (choice.outcome === 'accepted') {
      setVisible(false);
      (window as any).deferredPrompt = null;
    }
    setInstalling(false);
    setPrompt(null);
  };

  const handleDismiss = () => {
    setVisible(false);
    safeLocalStorage.setItem(DISMISSED_KEY, '1');
  };

  if (!visible || !prompt) return null;

  return (
    <div
      className={`fixed bottom-20 lg:bottom-4 left-4 right-4 md:right-4 md:left-auto md:mx-0 z-[200] mx-auto max-w-xs md:max-w-[300px] transition-all duration-300 ease-in-out ${
        footerInView
          ? 'translate-y-36 opacity-0 pointer-events-none'
          : 'translate-y-0 opacity-100'
      }`}
      role="dialog"
      aria-label="Instalar app Camisa Vetor"
    >
      <div className="bg-white rounded-2xl shadow-[0_12px_36px_rgba(0,0,0,0.18)] border border-gray-100 overflow-hidden">
        {/* Barra laranja decorativa */}
        <div className="h-0.5 bg-gradient-to-r from-[#fe7302] to-[#ff9a3c]" />

        <div className="p-3 sm:p-3.5">
          <div className="flex items-center gap-3">
            {/* Ícone do app */}
            <div className="flex-shrink-0 w-10 h-10 rounded-xl overflow-hidden shadow-sm">
              <Image
                src="/icon.png"
                alt="Camisa Vetor"
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Texto */}
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-black text-gray-900 uppercase tracking-tight">
                Instalar App
              </p>
              <p className="text-[10px] text-gray-500 font-medium leading-tight mt-0.5 line-clamp-2">
                {isMobile 
                  ? 'Acesse direto da tela inicial do celular' 
                  : 'Acesse direto da área de trabalho do computador'}
              </p>
            </div>

            {/* Botão fechar */}
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fe7302]"
              aria-label="Fechar"
            >
              <X size={13} />
            </button>
          </div>

          {/* Botão de instalação compacto */}
          <button
            onClick={handleInstall}
            disabled={installing}
            className="mt-2.5 w-full bg-[#fe7302] text-white font-bold text-[11px] uppercase tracking-wider py-2 rounded-xl flex items-center justify-center gap-1.5 hover:bg-[#e56600] active:scale-[0.98] transition-all shadow-md shadow-orange-500/20 disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#fe7302]"
          >
            <Download size={14} />
            {installing ? 'Instalando...' : (isMobile ? 'Adicionar à Tela Inicial' : 'Instalar no Computador')}
          </button>
        </div>
      </div>
    </div>
  );
}
