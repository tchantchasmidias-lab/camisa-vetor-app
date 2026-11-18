'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Product } from '@/components/HomeClient';
import { PromotionalSpace, sanitizePromotionalLink } from '@/lib/promotions';

interface HomeHeroProps {
  promotionalSpace?: PromotionalSpace;
  featuredProducts?: Product[];
  allProducts?: Product[];
}

export default function HomeHero({
  promotionalSpace,
  featuredProducts = [],
  allProducts = [],
}: HomeHeroProps) {
  const [imgError, setImgError] = useState(false);
  const [mobileImgError, setMobileImgError] = useState(false);

  // Fallbacks oficiais de alta fidelidade com transparência
  const defaultFallbackDesktop = '/images/derivatives/leao-pink-transparent.png';
  const defaultFallbackLeft = '/images/derivatives/fox-gold-transparent.png';
  const defaultFallbackRight = '/images/derivatives/carnaval-transparent.png';

  const hasCustomImage = Boolean(promotionalSpace?.imageUrl && !imgError);
  const customDesktopUrl = promotionalSpace?.imageUrl || '';
  const customMobileUrl = promotionalSpace?.mobileImageUrl && !mobileImgError
    ? promotionalSpace.mobileImageUrl
    : '';
  const altText = promotionalSpace?.altText || 'Camisa Vetor — Artes e Vetores Digitais Editáveis para Sublimação';

  // Sanitiza o destino: aceita rota interna ou HTTP/HTTPS seguro; fallback padrão: '/catalog'
  const destination = sanitizePromotionalLink(promotionalSpace?.linkUrl, '/catalog');
  const isExternal = destination.startsWith('http://') || destination.startsWith('https://');

  return (
    <section className="w-full pt-3 sm:pt-4 pb-1 sm:pb-2">
      {/* H1 estrutural acessível para SEO e leitores de tela (sem poluir a interface visual) */}
      <h1 className="sr-only">
        Camisa Vetor — Artes e Vetores Digitais Editáveis para Sublimação
      </h1>

      <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Banner Principal Clicável com Proporção Panorâmica no Desktop e Compacta no Mobile */}
        <Link
          href={destination}
          target={isExternal ? '_blank' : undefined}
          rel={isExternal ? 'noopener noreferrer' : undefined}
          aria-label={`${altText} — Clique para acessar o catálogo`}
          className="group relative block w-full h-[180px] sm:h-[240px] md:h-[280px] lg:h-[320px] xl:h-[350px] bg-[#f8f9fa] border border-slate-200/80 rounded-2xl sm:rounded-3xl overflow-hidden shadow-xs hover:border-orange-500/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fe7302] focus-visible:ring-offset-2 transition-all duration-300 cursor-pointer"
        >
          {hasCustomImage ? (
            /* Imagem Promocional Configurada pelo Admin */
            <div className="relative w-full h-full flex items-center justify-center p-2 sm:p-4">
              {customMobileUrl ? (
                /* Responsivo via picture: o navegador baixa SOMENTE a versão compatível com a largura de tela */
                <picture className="w-full h-full flex items-center justify-center">
                  <source media="(max-width: 640px)" srcSet={customMobileUrl} />
                  <Image
                    src={customDesktopUrl}
                    alt={altText}
                    fill
                    priority={true}
                    unoptimized={customDesktopUrl.startsWith('/')}
                    sizes="(max-width: 640px) 100vw, 1536px"
                    className="object-contain group-hover:scale-[1.01] transition-transform duration-300"
                    onError={() => setImgError(true)}
                  />
                </picture>
              ) : (
                <Image
                  src={customDesktopUrl}
                  alt={altText}
                  fill
                  priority={true}
                  unoptimized={customDesktopUrl.startsWith('/')}
                  sizes="(max-width: 640px) 100vw, 1536px"
                  className="object-contain group-hover:scale-[1.01] transition-transform duration-300"
                  onError={() => setImgError(true)}
                />
              )}
            </div>
          ) : (
            /* Fallback padrão: composição integrada e horizontal dos 3 mockups transparentes */
            <div className="relative w-full h-full flex items-center justify-center gap-2 sm:gap-6 lg:gap-10 px-3 sm:px-8 py-3">
              {/* Mockup Esquerda */}
              <div className="relative w-[30%] sm:w-[27%] max-w-[270px] aspect-[1.15/1] shrink-0 filter drop-shadow-md group-hover:scale-[1.02] transition-transform duration-300">
                <Image
                  src={defaultFallbackLeft}
                  alt="Vetor Interclasse Fox Gold"
                  fill
                  priority={true}
                  unoptimized={true}
                  sizes="(max-width: 640px) 110px, 270px"
                  className="object-contain"
                />
              </div>

              {/* Mockup Centro (Destaque Principal) */}
              <div className="relative w-[36%] sm:w-[32%] max-w-[320px] aspect-[1.15/1] shrink-0 filter drop-shadow-lg group-hover:scale-[1.03] transition-transform duration-300 z-10">
                <Image
                  src={defaultFallbackDesktop}
                  alt={altText}
                  fill
                  priority={true}
                  unoptimized={true}
                  sizes="(max-width: 640px) 130px, 320px"
                  className="object-contain"
                />
              </div>

              {/* Mockup Direita */}
              <div className="relative w-[30%] sm:w-[27%] max-w-[270px] aspect-[1.15/1] shrink-0 filter drop-shadow-md group-hover:scale-[1.02] transition-transform duration-300">
                <Image
                  src={defaultFallbackRight}
                  alt="Vetor Carnaval Folia"
                  fill
                  priority={true}
                  unoptimized={true}
                  sizes="(max-width: 640px) 110px, 270px"
                  className="object-contain"
                />
              </div>
            </div>
          )}
        </Link>
      </div>
    </section>
  );
}
