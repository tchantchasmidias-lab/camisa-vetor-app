'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Product } from '@/components/HomeClient';
import { PromotionalSpace, sanitizePromotionalLink } from '@/lib/promotions';

interface CarnavalBannerProps {
  promotionalSpace?: PromotionalSpace;
  products?: Product[];
}

export default function CarnavalBanner({
  promotionalSpace,
  products = [],
}: CarnavalBannerProps) {
  const [imgError, setImgError] = useState(false);
  const [mobileImgError, setMobileImgError] = useState(false);

  // Fallback padrão
  const defaultFallback = '/images/derivatives/carnaval-transparent.png';

  const hasCustomImage = Boolean(promotionalSpace?.imageUrl && !imgError);
  const customDesktopUrl = promotionalSpace?.imageUrl || '';
  const customMobileUrl = promotionalSpace?.mobileImageUrl && !mobileImgError
    ? promotionalSpace.mobileImageUrl
    : '';
  const altText = promotionalSpace?.altText || 'Coleção de Carnaval em cada detalhe — Camisa Vetor';

  // Sanitiza o destino: normaliza links internos (inclusive camisavetor.com.br); padrão da coleção: '/catalog?category=carnaval'
  const destination = sanitizePromotionalLink(promotionalSpace?.linkUrl, '/catalog?category=carnaval');

  return (
    <section id="carnaval" className="w-full my-6 sm:my-10">
      {hasCustomImage ? (
        /* Banner Promocional de Coleção: preenche 100% da largura útil sem faixas laterais nem altura fixa */
        <Link
          href={destination}
          aria-label={`${altText} — Clique para acessar a coleção`}
          className="group relative block w-full rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-200/80 shadow-xs hover:border-orange-500/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fe7302] focus-visible:ring-offset-2 transition-all duration-300 cursor-pointer bg-slate-50"
        >
          {customMobileUrl ? (
            /* Responsivo via picture quando há imagem mobile cadastrada */
            <picture className="block w-full">
              <source media="(max-width: 640px)" srcSet={customMobileUrl} />
              <Image
                src={customDesktopUrl}
                alt={altText}
                width={1400}
                height={450}
                loading="lazy"
                unoptimized={true}
                sizes="(max-width: 640px) 100vw, (max-width: 1536px) 100vw, 1536px"
                className="w-full h-auto block object-contain transition-transform duration-300 group-hover:scale-[1.005]"
                onError={() => setImgError(true)}
              />
            </picture>
          ) : (
            /* Exibe proporcionalmente a imagem desktop com largura total e altura automática */
            <Image
              src={customDesktopUrl}
              alt={altText}
              width={1400}
              height={450}
              loading="lazy"
              unoptimized={true}
              sizes="(max-width: 640px) 100vw, (max-width: 1536px) 100vw, 1536px"
              className="w-full h-auto block object-contain transition-transform duration-300 group-hover:scale-[1.005]"
              onError={() => setImgError(true)}
            />
          )}
        </Link>
      ) : (
        /* Fallback padrão: banner clicável com o mockup transparente integrado */
        <Link
          href={destination}
          aria-label={`${altText} — Clique para acessar a coleção`}
          className="group relative block w-full h-[180px] sm:h-[240px] md:h-[280px] lg:h-[320px] bg-[#111111] border border-orange-500/20 rounded-2xl sm:rounded-3xl overflow-hidden shadow-md hover:border-orange-500/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fe7302] focus-visible:ring-offset-2 transition-all duration-300 cursor-pointer"
        >
          <div className="relative w-full h-full flex items-center justify-center p-4">
            <Image
              src={defaultFallback}
              alt={altText}
              fill
              loading="lazy"
              unoptimized={true}
              sizes="(max-width: 640px) 280px, (max-width: 1024px) 400px, 480px"
              className="object-contain group-hover:scale-[1.02] transition-transform duration-300 filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.6)]"
            />
          </div>
        </Link>
      )}
    </section>
  );
}
