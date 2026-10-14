'use client';

import { useEffect } from 'react';
import { useGeo } from '@/lib/i18n/GeoContext';
import { safeSessionStorage } from '@/lib/safeStorage';
import { shouldIgnoreError, isBotUserAgent } from '@/lib/errorUtils';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useGeo();

  useEffect(() => {
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    const message = (error?.message || '').toLowerCase();
    const isChunkError =
      error?.name === 'ChunkLoadError' ||
      message.includes('loading chunk') ||
      message.includes('chunkloaderror') ||
      message.includes('failed to fetch dynamically imported module');

    // Se for ChunkLoadError (versão antiga após deploy), recarrega a página automaticamente
    if (isChunkError && typeof window !== 'undefined') {
      const lastReload = safeSessionStorage.getItem('chunk_reload');
      const now = Date.now();
      if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
        safeSessionStorage.setItem('chunk_reload', now.toString());
        window.location.reload();
        return;
      }
    }

    // Não envia alertas para erros ignorados (rede transitória, conexões fechadas, aborts, crawlers/bots)
    if (
      shouldIgnoreError(error?.message, userAgent) ||
      shouldIgnoreError(error?.stack, userAgent) ||
      isBotUserAgent(userAgent)
    ) {
      return;
    }

    try {
      fetch('/api/logs/client-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: error?.message || 'Erro não tratado no cliente',
          stack: error?.stack,
          digest: error?.digest,
          pathname: typeof window !== 'undefined' ? window.location.pathname : '',
          userAgent,
        }),
      }).catch(() => {});
    } catch {
      // Ignora erro de envio
    }
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4 text-2xl font-bold">
        !
      </div>
      <h2 className="text-xl font-bold uppercase tracking-widest text-gray-900 mb-2">
        {t('somethingWentWrong')}
      </h2>
      <p className="text-gray-500 text-sm max-w-md mb-6">{error.message || 'Ocorreu um erro inesperado ao carregar esta página.'}</p>
      <button
        onClick={() => reset()}
        className="bg-[#fe7302] text-white px-8 py-3.5 rounded-2xl font-bold uppercase tracking-wider text-[11px] shadow-lg shadow-orange-500/20 hover:bg-black transition-all"
      >
        {t('tryAgain')}
      </button>
    </div>
  );
}