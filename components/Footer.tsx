'use client';

import { usePathname } from 'next/navigation';
import { useGeo } from '@/lib/i18n/GeoContext';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const { t } = useGeo();
  const pathname = usePathname();
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Não mostra se já estiver instalado (modo standalone)
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    const checkGlobalPrompt = () => {
      if ((window as any).deferredPrompt) {
        setPrompt((window as any).deferredPrompt);
      }
    };

    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
    };

    checkGlobalPrompt();

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('cv-pwa-prompt-available', checkGlobalPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('cv-pwa-prompt-available', checkGlobalPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!prompt) return;
    await prompt.prompt();
    const choice = await prompt.userChoice;
    if (choice.outcome === 'accepted') {
      setPrompt(null);
      (window as any).deferredPrompt = null;
    }
  };

  if (pathname === '/admin') return null;

  return (
    <footer className="bg-white border-t border-gray-100 pt-4 pb-10 md:py-10 mt-4 md:mt-20">
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
        
        {/* COPYRIGHT */}
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] text-center md:text-left">
          © {currentYear} CAMISA VETOR. {t('allRightsReserved')}.
        </p>

        {/* LINKS SIMPLES */}
        <nav className="flex items-center space-x-6 flex-wrap justify-center md:justify-end gap-y-2">
          <Link 
            href="/termos" 
            className="text-[10px] font-bold text-gray-400 hover:text-[#fe7302] transition-colors uppercase tracking-widest"
          >
            {t('termsOfUse')}
          </Link>
          <Link 
            href="/privacidade" 
            className="text-[10px] font-bold text-gray-400 hover:text-[#fe7302] transition-colors uppercase tracking-widest"
          >
            {t('privacyPolicy')}
          </Link>
          <Link 
            href="https://wa.me/558791425634" 
            target="_blank"
            className="text-[10px] font-bold text-gray-400 hover:text-[#fe7302] transition-colors uppercase tracking-widest"
          >
            {t('support')}
          </Link>

          {/* Botão de instalar app */}
          {prompt && (
            <button
              onClick={handleInstall}
              className="flex items-center gap-1.5 text-[10px] font-black text-[#fe7302] hover:text-orange-600 transition-colors uppercase tracking-widest cursor-pointer outline-none border-none bg-transparent"
              aria-label="Instalar aplicativo"
            >
              <Download size={12} className="flex-shrink-0" />
              {t('installApp')}
            </button>
          )}
        </nav>

      </div>
    </footer>
  );
}