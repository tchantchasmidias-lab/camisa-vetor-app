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
 * - Aceita caminhos internos válidos (ex: /catalog, /categoria/carnaval, /#novidades)
 * - Aceita URLs absolutas HTTP ou HTTPS válidas
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
    linkUrl: '',
  },
};

