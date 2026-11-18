'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Product } from '@/components/HomeClient';
import type { PromotionalSpace } from '@/lib/promotions';

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

  // Fallback padrão com fundo transparente integrado ao banner
  const defaultFallback = '/images/derivatives/carnaval-transparent.png';

  const hasCustomImage = Boolean(promotionalSpace?.imageUrl && !imgError);
  const customDesktopUrl = promotionalSpace?.imageUrl || '';
  const customMobileUrl = promotionalSpace?.mobileImageUrl && !mobileImgError
    ? promotionalSpace.mobileImageUrl
    : '';
  const altText = promotionalSpace?.altText || 'Coleção de Carnaval em cada detalhe — Camisa Vetor';

  return (
    <section id="carnaval" className="my-6 sm:my-10">
      <div className="relative rounded-2xl md:rounded-3xl overflow-hidden bg-[#111111] border border-orange-500/20 shadow-lg">
        
        {/* Efeitos sutis de iluminação laranja e faixas dinâmicas de fundo */}
        <div className="absolute -top-16 -left-16 w-64 h-64 bg-orange-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-72 h-72 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative p-5 sm:p-8 lg:p-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          
          {/* TEXTO EDITORIAL EM HTML */}
          <div className="lg:col-span-5 text-left z-10">
            <h2 className="tracking-tight mb-2 sm:mb-3">
              <span className="block text-[#fe7302] text-2xl sm:text-3xl lg:text-4xl font-black leading-tight">
                Carnaval
              </span>
              <span className="block text-white text-xl sm:text-2xl lg:text-3xl font-black leading-tight">
                em cada detalhe.
              </span>
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 font-normal leading-relaxed mb-4 sm:mb-6 max-w-sm">
              Artes vibrantes e cheias de estilo para o seu bloco, equipe ou evento.
            </p>

            <Link
              href="/catalog?category=carnaval"
              className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg bg-[#fe7302] hover:bg-[#e56600] text-white font-bold text-xs sm:text-sm transition-all shadow-md active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fe7302]"
            >
              <span>Explorar coleção</span>
              <span className="text-sm font-semibold leading-none">›</span>
            </Link>
          </div>

          {/* ESPAÇO PROMOCIONAL CONFIGURÁVEL NO ADMIN */}
          <div className="lg:col-span-7 flex justify-center lg:justify-end">
            <div className="relative w-full max-w-[320px] sm:max-w-[420px] lg:max-w-[480px] h-[180px] sm:h-[240px] lg:h-[280px] block group">
              <div className="relative w-full h-full filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.6)] transition-transform duration-300 group-hover:scale-[1.02]">
                {hasCustomImage ? (
                  customMobileUrl ? (
                    <picture>
                      <source media="(max-width: 640px)" srcSet={customMobileUrl} />
                      <Image
                        src={customDesktopUrl}
                        alt={altText}
                        fill
                        loading="lazy"
                        unoptimized={customDesktopUrl.startsWith('/')}
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 480px"
                        quality={85}
                        className="object-contain"
                        onError={() => setImgError(true)}
                      />
                    </picture>
                  ) : (
                    <Image
                      src={customDesktopUrl}
                      alt={altText}
                      fill
                      loading="lazy"
                      unoptimized={customDesktopUrl.startsWith('/')}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 480px"
                      quality={85}
                      className="object-contain"
                      onError={() => setImgError(true)}
                    />
                  )
                ) : (
                  <Image
                    src={defaultFallback}
                    alt={altText}
                    fill
                    loading="lazy"
                    unoptimized={true}
                    sizes="(max-width: 640px) 280px, (max-width: 1024px) 400px, 480px"
                    className="object-contain"
                  />
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
