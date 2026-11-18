export interface PromotionalSpace {
  imageUrl?: string;
  mobileImageUrl?: string;
  altText?: string;
  linkUrl?: string;
  updatedAt?: number;
}

export interface HomePromotions {
  hero?: PromotionalSpace;
  collectionHighlight?: PromotionalSpace;
}

/**
 * Valida e sanitiza links promocionais:
 * - Aceita caminhos internos válidos (ex: /catalog, /?category=comemorativas, /#novidades)
 * - Aceita URLs absolutas HTTP ou HTTPS válidas
 * - Se a URL apontar para o próprio domínio do site (camisavetor.com.br ou localhost),
 *   normaliza para o caminho interno correspondente, viabilizando navegação na mesma aba.
 * - Rejeita protocolos inseguros (javascript:, data:, vbscript:, etc.) e URLs malformadas
 */
export function sanitizePromotionalLink(url?: string, defaultUrl: string = '/catalog'): string {
  if (!url || typeof url !== 'string') return defaultUrl;
  const trimmed = url.trim();
  if (!trimmed) return defaultUrl;

  // Caminho interno válido (começa com '/' e não com '//')
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return trimmed;
  }

  // URL HTTP ou HTTPS absoluta
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      const hostname = parsed.hostname.toLowerCase();
      if (
        hostname === 'camisavetor.com.br' ||
        hostname === 'www.camisavetor.com.br' ||
        hostname === 'localhost' ||
        hostname === '127.0.0.1'
      ) {
        return (parsed.pathname || '/') + parsed.search + parsed.hash;
      }
      return trimmed;
    }
  } catch {}

  // Rejeita qualquer outro protocolo inseguro e retorna destino padrão
  return defaultUrl;
}

export const DEFAULT_HOME_PROMOTIONS: HomePromotions = {
  hero: {
    imageUrl: '/images/derivatives/leao-pink-transparent.png',
    mobileImageUrl: '',
    altText: 'Artes Digitais Editáveis para Estamparia — Camisa Vetor',
    linkUrl: '/catalog',
  },
  collectionHighlight: {
    imageUrl: '/images/derivatives/carnaval-transparent.png',
    mobileImageUrl: '',
    altText: 'Coleção Carnaval em Cada Detalhe — Camisa Vetor',
    linkUrl: '/catalog?category=carnaval',
  },
};

