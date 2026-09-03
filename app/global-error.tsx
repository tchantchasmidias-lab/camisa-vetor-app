'use client';

import { useEffect } from 'react';
import { safeSessionStorage } from '@/lib/safeStorage';
import { shouldIgnoreError } from '@/lib/errorUtils';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
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

    // Não envia alertas para erros ignorados (rede, abort, crawlers, storage sandbox)
    if (shouldIgnoreError(error?.message) || shouldIgnoreError(error?.stack)) {
      return;
    }

    try {
      fetch('/api/logs/client-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: error?.message || 'Erro crítico global na aplicação',
          stack: error?.stack,
          digest: error?.digest,
          pathname: typeof window !== 'undefined' ? window.location.pathname : '',
        }),
      }).catch(() => {});
    } catch {
      // Ignora erro de envio
    }
  }, [error]);

  return (
    <html lang="pt-BR">
      <body style={{ fontFamily: 'sans-serif', margin: 0, padding: 0, backgroundColor: '#0c0d0e', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center', padding: 32, maxWidth: 500 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Ocorreu uma falha no sistema</h1>
          <p style={{ color: '#9ca3af', fontSize: 14, marginBottom: 24 }}>Nossa equipe já foi notificada automaticamente com os detalhes técnicos do erro.</p>
          <button
            onClick={() => reset()}
            style={{ backgroundColor: '#fe7302', color: '#ffffff', border: 'none', padding: '12px 24px', borderRadius: 12, fontWeight: 700, cursor: 'pointer', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 }}
          >
            Recarregar Aplicação
          </button>
        </div>
      </body>
    </html>
  );
}
