'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { X, Download } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISSED_KEY = 'cv_install_dismissed';

export default function PwaInstallBanner() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    // Não mostra se já foi dispensado
    if (localStorage.getItem(DISMISSED_KEY)) return;

    // Não mostra se já está instalado (modo standalone)
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    // Não mostra em desktop — apenas mobile (≤ 768px)
    if (window.innerWidth > 768) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
      // Mostra o banner após 3 segundos
      setTimeout(() => setVisible(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!prompt) return;
    setInstalling(true);
    await prompt.prompt();
    const choice = await prompt.userChoice;
    if (choice.outcome === 'accepted') {
      setVisible(false);
    }
    setInstalling(false);
    setPrompt(null);
  };

  const handleDismiss = () => {
    setVisible(false);
    localStorage.setItem(DISMISSED_KEY, '1');
  };

  if (!visible || !prompt) return null;

  return (
    <div
      className="fixed bottom-4 left-4 right-4 z-[200] mx-auto max-w-sm animate-in slide-in-from-bottom-4 fade-in duration-500"
      role="dialog"
      aria-label="Instalar app Camisa Vetor"
    >
      <div className="bg-white rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] border border-gray-100 overflow-hidden">
        {/* Barra laranja decorativa */}
        <div className="h-1 bg-gradient-to-r from-[#fe7302] to-[#ff9a3c]" />

        <div className="p-5">
          <div className="flex items-center gap-4">
            {/* Ícone do app */}
            <div className="flex-shrink-0 w-14 h-14 rounded-2xl overflow-hidden shadow-md">
              <Image
                src="/pwa-icon-192.png"
                alt="Camisa Vetor"
                width={56}
                height={56}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Texto */}
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-black text-gray-900 uppercase tracking-tight">
                Instalar App
              </p>
              <p className="text-[11px] text-gray-500 font-medium leading-tight mt-0.5">
                Acesse a Camisa Vetor direto da tela inicial do seu celular
              </p>
            </div>

            {/* Botão fechar */}
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200 transition-colors"
              aria-label="Fechar"
            >
              <X size={14} />
            </button>
          </div>

          {/* Botão de instalação */}
          <button
            onClick={handleInstall}
            disabled={installing}
            className="mt-4 w-full bg-[#fe7302] text-white font-black text-[12px] uppercase tracking-widest py-3.5 rounded-2xl flex items-center justify-center gap-2 hover:bg-[#e56600] active:scale-[0.98] transition-all shadow-lg shadow-orange-500/20 disabled:opacity-70"
          >
            <Download size={16} />
            {installing ? 'Instalando...' : 'Adicionar à Tela Inicial'}
          </button>
        </div>
      </div>
    </div>
  );
}
