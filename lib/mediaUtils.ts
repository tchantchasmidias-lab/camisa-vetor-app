/**
 * Helper para converter URLs brutas do Firebase Storage em URLs limpas e amigáveis para SEO.
 * Exemplo:
 * Entrada:  https://firebasestorage.googleapis.com/v0/b/.../destaques%2F17861...webp?alt=media&token=...
 * Saída:    https://camisavetor.com.br/media/produtos/nome-do-produto-destaque.webp?url=...
 */
export function buildCleanImageUrl(
  originalUrl: string | undefined | null,
  slug: string,
  variant: string = 'destaque'
): string {
  if (!originalUrl) return '';

  // Se já for uma URL local ou limpa, retorna sem alterar
  if (originalUrl.startsWith('/media/') || originalUrl.startsWith('https://camisavetor.com.br/media/')) {
    return originalUrl;
  }

  // Aplica o proxy de URLs limpas para mídias do Firebase Storage
  if (
    originalUrl.includes('firebasestorage.googleapis.com') ||
    originalUrl.includes('firebasestorage.app') ||
    originalUrl.includes('storage.googleapis.com')
  ) {
    // Remove caracteres especiais do slug para manter a URL 100% amigável
    const safeSlug = slug
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-');

    const cleanFileName = `${safeSlug}-${variant}.webp`;
    return `https://camisavetor.com.br/media/produtos/${cleanFileName}?url=${encodeURIComponent(originalUrl)}`;
  }

  return originalUrl;
}
