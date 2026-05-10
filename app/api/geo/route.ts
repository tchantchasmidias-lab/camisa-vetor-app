import { NextRequest, NextResponse } from 'next/server';

// Mapeamento de países para idiomas e moedas
const GEO_MAP: Record<string, { language: string; currency: string; currencySymbol: string; currencyCode: string }> = {
  // Brasil
  BR: { language: 'pt', currency: 'BRL', currencySymbol: 'R$', currencyCode: 'BRL' },
  // América do Norte anglófona
  US: { language: 'en', currency: 'USD', currencySymbol: '$', currencyCode: 'USD' },
  CA: { language: 'en', currency: 'USD', currencySymbol: '$', currencyCode: 'USD' },
  // Europa - Euro
  FR: { language: 'fr', currency: 'EUR', currencySymbol: '€', currencyCode: 'EUR' },
  DE: { language: 'de', currency: 'EUR', currencySymbol: '€', currencyCode: 'EUR' },
  AT: { language: 'de', currency: 'EUR', currencySymbol: '€', currencyCode: 'EUR' },
  IT: { language: 'es', currency: 'EUR', currencySymbol: '€', currencyCode: 'EUR' },
  PT: { language: 'pt', currency: 'EUR', currencySymbol: '€', currencyCode: 'EUR' },
  NL: { language: 'en', currency: 'EUR', currencySymbol: '€', currencyCode: 'EUR' },
  BE: { language: 'fr', currency: 'EUR', currencySymbol: '€', currencyCode: 'EUR' },
  ES: { language: 'es', currency: 'EUR', currencySymbol: '€', currencyCode: 'EUR' },
  // América Latina (espanhol)
  MX: { language: 'es', currency: 'USD', currencySymbol: '$', currencyCode: 'USD' },
  AR: { language: 'es', currency: 'USD', currencySymbol: '$', currencyCode: 'USD' },
  CL: { language: 'es', currency: 'USD', currencySymbol: '$', currencyCode: 'USD' },
  CO: { language: 'es', currency: 'USD', currencySymbol: '$', currencyCode: 'USD' },
  PE: { language: 'es', currency: 'USD', currencySymbol: '$', currencyCode: 'USD' },
  // UK
  GB: { language: 'en', currency: 'GBP', currencySymbol: '£', currencyCode: 'GBP' },
  // Austrália / Nova Zelândia
  AU: { language: 'en', currency: 'USD', currencySymbol: '$', currencyCode: 'USD' },
  NZ: { language: 'en', currency: 'USD', currencySymbol: '$', currencyCode: 'USD' },
  // Japão
  JP: { language: 'en', currency: 'USD', currencySymbol: '$', currencyCode: 'USD' },
};

const DEFAULT_GEO = { language: 'en', currency: 'USD', currencySymbol: '$', currencyCode: 'USD' };

export async function GET(req: NextRequest) {
  try {
    // Pega IP do cliente (Vercel injeta x-forwarded-for)
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : '8.8.8.8';

    // Em localhost, simula como Brasil
    if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168') || ip.startsWith('10.')) {
      return NextResponse.json({
        country: 'BR',
        isInternational: false,
        ...GEO_MAP['BR'],
      });
    }

    // Consulta API gratuita de geolocalização
    const geoRes = await fetch(`http://ip-api.com/json/${ip}?fields=countryCode`, {
      next: { revalidate: 3600 }, // Cache de 1 hora
    });

    if (!geoRes.ok) {
      throw new Error('Geo API unavailable');
    }

    const geoData = await geoRes.json();
    const countryCode = geoData.countryCode as string;
    const geoInfo = GEO_MAP[countryCode] || DEFAULT_GEO;

    return NextResponse.json({
      country: countryCode,
      isInternational: countryCode !== 'BR',
      ...geoInfo,
    });
  } catch (error) {
    console.error('Geo detection error:', error);
    // Fallback seguro: Brasil
    return NextResponse.json({
      country: 'BR',
      isInternational: false,
      ...GEO_MAP['BR'],
    });
  }
}
