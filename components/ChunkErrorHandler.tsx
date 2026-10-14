'use client';

import { useEffect } from 'react';
import { safeSessionStorage } from '@/lib/safeStorage';
import { shouldIgnoreError } from '@/lib/errorUtils';

/**
 * Componente que intercepta ChunkLoadError no navegador (erros que ocorrem
 * quando um usuário está com uma versão antiga do site aberta e ocorre um novo deploy).
 * Recarrega a página suavemente para baixar os novos chunks sem disparar erros falsos.
 * Também intercepta e suprime rejeições e desconexões transitórias (ex: Connection closed).
 */
export default function ChunkErrorHandler() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isChunkError = (message?: string | null): boolean => {
      if (!message) return false;
      const lower = message.toLowerCase();
      return (
        lower.includes('loading chunk') ||
        lower.includes('chunkloaderror') ||
        lower.includes('failed to fetch dynamically imported module') ||
        lower.includes('importing a module script failed')
      );
    };

    const handleChunkReload = () => {
      const lastReload = safeSessionStorage.getItem('chunk_reload');
      const now = Date.now();
      if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
        safeSessionStorage.setItem('chunk_reload', now.toString());
        window.location.reload();
      }
    };

    const onError = (event: ErrorEvent) => {
      const msg = event?.message || event?.error?.message;
      if (isChunkError(msg)) {
        event.preventDefault?.();
        handleChunkReload();
        return;
      }
      if (shouldIgnoreError(msg, navigator.userAgent)) {
        event.preventDefault?.();
      }
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event?.reason;
      const message = typeof reason === 'string' ? reason : reason?.message || '';
      if (isChunkError(message)) {
        event.preventDefault?.();
        handleChunkReload();
        return;
      }
      if (shouldIgnoreError(message, navigator.userAgent)) {
        event.preventDefault?.();
      }
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onUnhandledRejection);

    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onUnhandledRejection);
    };
  }, []);

  return null;
}
