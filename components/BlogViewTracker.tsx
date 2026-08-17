'use client';

import { useEffect } from 'react';

export default function BlogViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    if (!slug) return;
    fetch('/api/blog/view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug }),
    }).catch(err => console.error('Erro ao registrar visualização:', err));
  }, [slug]);

  return null;
}
