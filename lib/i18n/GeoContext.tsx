'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import { translations, Language } from './translations';

export interface GeoInfo {
  country: string;
  language: Language;
  currency: string;
  currencySymbol: string;
  currencyCode: string;
  isInternational: boolean;
}

interface GeoContextType extends GeoInfo {
  t: (key: string) => string;
  tp: (text: string) => string; // Translate Product/Dynamic text
  formatPrice: (value: number) => string;
  isLoading: boolean;
}

const defaultGeo: GeoInfo = {
  country: 'BR',
  language: 'pt',
  currency: 'BRL',
  currencySymbol: 'R$',
  currencyCode: 'BRL',
  isInternational: false,
};

const GeoContext = createContext<GeoContextType>({
  ...defaultGeo,
  t: (key: string) => translations['pt'][key] || key,
  tp: (text: string) => text,
  formatPrice: (value: number) => `R$ ${value.toFixed(2).replace('.', ',')}`,
  isLoading: true,
});

export function GeoProvider({ children }: { children: ReactNode }) {
  const [geo, setGeo] = useState<GeoInfo>(defaultGeo);
  const [isLoading, setIsLoading] = useState(true);
  const [dynamicCache, setDynamicCache] = useState<Record<string, Record<string, string>>>({});

  useEffect(() => {
    // 0. VERIFICA OVERRIDE DE TESTE NA URL (Prioridade Máxima)
    const params = new URLSearchParams(window.location.search);
    const testLang = params.get('testLang');
    
    if (testLang) {
      const lang = testLang as Language;
      const maps: Record<string, GeoInfo> = {
        en: { country: 'US', language: 'en', currency: 'USD', currencySymbol: '$', currencyCode: 'USD', isInternational: true },
        es: { country: 'ES', language: 'es', currency: 'EUR', currencySymbol: '€', currencyCode: 'EUR', isInternational: true },
        fr: { country: 'FR', language: 'fr', currency: 'EUR', currencySymbol: '€', currencyCode: 'EUR', isInternational: true },
        de: { country: 'DE', language: 'de', currency: 'EUR', currencySymbol: '€', currencyCode: 'EUR', isInternational: true },
        pt: { country: 'BR', language: 'pt', currency: 'BRL', currencySymbol: 'R$', currencyCode: 'BRL', isInternational: false },
      };
      
      if (maps[lang]) {
        setGeo(maps[lang]);
        setIsLoading(false);
        return;
      }
    }

    // 1. Tenta usar cache do sessionStorage
    const cached = sessionStorage.getItem('geo_info');
    if (cached) {
      try {
        setGeo(JSON.parse(cached));
        setIsLoading(false);
        return;
      } catch { /* ignore */ }
    }

    // 2. Busca via API (IP)
    fetch('/api/geo')
      .then(res => res.json())
      .then((data: GeoInfo) => {
        setGeo(data);
        sessionStorage.setItem('geo_info', JSON.stringify(data));
      })
      .catch(() => {
        setGeo(defaultGeo);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  // Carrega o cache inicial do localStorage
  useEffect(() => {
    const savedCache = localStorage.getItem('translation_cache');
    if (savedCache) {
      try {
        setDynamicCache(JSON.parse(savedCache));
      } catch (e) {
        console.error('Failed to load translation cache', e);
      }
    }
  }, []);

  // Salva o cache no localStorage sempre que mudar
  useEffect(() => {
    if (Object.keys(dynamicCache).length > 0) {
      localStorage.setItem('translation_cache', JSON.stringify(dynamicCache));
    }
  }, [dynamicCache]);

  const lang = geo.language as Language;

  // Função de tradução simples (dicionário fixo)
  const t = (key: string): string => {
    return translations[lang]?.[key] ?? translations['pt']?.[key] ?? key;
  };

  // Referência para evitar múltiplos pedidos simultâneos para o mesmo texto
  const pendingTranslations = useRef<Set<string>>(new Set());

  // Função de tradução inteligente para produtos (dinâmica)
  const tp = (text: string): string => {
    if (!text || lang === 'pt') return text;
    
    // 1. Verifica no cache dinâmico da API
    if (dynamicCache[lang]?.[text]) {
      return dynamicCache[lang][text];
    }

    // 2. Verifica no dicionário fixo (fallback rápido)
    const commonTerms = translations[lang]?.['_dynamic'] || {};
    let translated = text;
    let foundInDictionary = false;

    Object.entries(commonTerms).forEach(([pt, target]) => {
      const escapedPt = pt.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(?<![a-zA-Z0-9áàâãéèêíïóôõöúçÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇ])${escapedPt}(?![a-zA-Z0-9áàâãéèêíïóôõöúçÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇ])`, 'gi');
      if (regex.test(text)) {
        translated = translated.replace(regex, target as string);
        foundInDictionary = true;
      }
    });

    // 3. Se não for uma correspondência exata do dicionário e for um texto longo, busca na API
    const cacheKey = `${lang}:${text}`;
    if (text.length > 3 && !dynamicCache[lang]?.[text] && !pendingTranslations.current.has(cacheKey)) {
       // Marca como pendente IMEDIATAMENTE para evitar duplicatas em renderizações rápidas
       pendingTranslations.current.add(cacheKey);

       // Pequeno delay para não sobrecarregar no carregamento inicial da página
       setTimeout(() => {
         fetch('/api/translate', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ text, target: lang })
         })
         .then(res => res.json())
         .then(data => {
           if (data.translatedText) {
             setDynamicCache(prev => {
               const newCache = {
                 ...prev,
                 [lang]: {
                   ...(prev[lang] || {}),
                   [text]: data.translatedText
                 }
               };
               return newCache;
             });
           }
         })
         .catch(err => {
           console.error('Translation error:', err);
           // Em caso de erro, removemos do pending após um tempo para permitir tentar de novo
           setTimeout(() => pendingTranslations.current.delete(cacheKey), 5000);
         });
       }, 100);
    }

    return translated;
  };

  // Função de formatação de preço
  const formatPrice = (value: number): string => {
    if (geo.isInternational) {
      return `${geo.currencySymbol} ${value.toFixed(2)}`;
    }
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
  };

  // Sincroniza o atributo lang do HTML para SEO/Acessibilidade
  useEffect(() => {
    if (lang) {
      document.documentElement.lang = lang;
    }
  }, [lang]);

  return (
    <GeoContext.Provider value={{ ...geo, t, tp, formatPrice, isLoading }}>
      {children}
    </GeoContext.Provider>
  );
}

export function useGeo() {
  return useContext(GeoContext);
}
