'use client';

import { usePathname } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Mail, MapPin } from 'lucide-react';
import { useGeo } from '@/lib/i18n/GeoContext';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const { t } = useGeo();
  const pathname = usePathname();

  // Não renderiza no admin, no studio ou na experiência retrô XP
  if (pathname === '/admin' || pathname.startsWith('/xp') || pathname.startsWith('/studio')) return null;

  return (
    <footer className="bg-[#000000] border-t border-[#1e293b] mt-8 md:mt-20 text-white font-sans">
      {/* BLOCO PRINCIPAL: 4 COLUNAS NO DESKTOP, 2 NO TABLET, 1 NO CELULAR */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 md:pt-14 pb-8 md:pb-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 lg:gap-10 items-start">

        {/* COLUNA 1: IDENTIDADE, DESCRIÇÃO, E-MAIL E LOCALIZAÇÃO */}
        <div className="flex flex-col items-start">
          <Link
            href="/"
            className="inline-flex items-center gap-3 mb-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fe7302] focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-lg transition-transform"
            aria-label="Camisa Vetor - Início"
          >
            <img
              src="/logo-icon.png"
              alt="Camisa Vetor Ícone"
              width="32"
              height="32"
              className="w-8 h-8 object-contain group-hover:scale-105 transition-transform duration-200"
            />
            <Image
              src="/logo.svg"
              alt="Camisa Vetor"
              width={135}
              height={24}
              className="h-[20px] w-auto group-hover:opacity-95 transition-opacity duration-200"
            />
          </Link>

          <p className="text-sm text-slate-300 leading-relaxed mb-3.5 md:mb-5">
            Plataforma brasileira de vetores profissionais para estamparia, sublimação e personalização de produtos.
          </p>

          <div className="flex flex-col gap-2 md:gap-2.5 text-sm">
            <a
              href="mailto:contato@camisavetor.com"
              className="inline-flex items-center gap-2.5 text-slate-300 hover:text-[#fe7302] transition-colors font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fe7302] focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded py-0.5 w-fit"
            >
              <Mail size={16} className="text-[#fe7302] stroke-[#fe7302] shrink-0" />
              <span>contato@camisavetor.com</span>
            </a>
            <div className="inline-flex items-center gap-2.5 text-slate-300 font-medium py-0.5">
              <MapPin size={16} className="text-[#fe7302] stroke-[#fe7302] shrink-0" />
              <span>Pesqueira — PE, Brasil</span>
            </div>
          </div>
        </div>

        {/* COLUNA 2: LINKS INSTITUCIONAIS */}
        <div className="flex flex-col items-start">
          <h3 className="text-xs font-black uppercase tracking-wider text-white mb-3 md:mb-4">
            Institucional
          </h3>
          <ul className="flex flex-col gap-2.5 md:gap-3 p-0 m-0 list-none text-sm w-full">
            <li>
              <Link
                href="/blog"
                className="inline-flex items-center gap-2.5 text-slate-300 hover:text-[#fe7302] transition-all hover:translate-x-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fe7302] focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded py-0.5 w-fit font-medium"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fe7302" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"></path>
                  <path d="M6 6h10"></path>
                  <path d="M6 10h10"></path>
                </svg>
                <span>Blog</span>
              </Link>
            </li>
            <li>
              <Link
                href="/sobre"
                className="inline-flex items-center gap-2.5 text-slate-300 hover:text-[#fe7302] transition-all hover:translate-x-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fe7302] focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded py-0.5 w-fit font-medium"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fe7302" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                <span>Sobre Nós</span>
              </Link>
            </li>
            <li>
              <Link
                href="/termos"
                className="inline-flex items-center gap-2.5 text-slate-300 hover:text-[#fe7302] transition-all hover:translate-x-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fe7302] focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded py-0.5 w-fit font-medium"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fe7302" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                <span>Termos de Uso</span>
              </Link>
            </li>
            <li>
              <Link
                href="/privacidade"
                className="inline-flex items-center gap-2.5 text-slate-300 hover:text-[#fe7302] transition-all hover:translate-x-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fe7302] focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded py-0.5 w-fit font-medium"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fe7302" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
                <span>Privacidade</span>
              </Link>
            </li>
            <li>
              <a
                href="https://wa.me/558791425634"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 text-slate-300 hover:text-[#fe7302] transition-all hover:translate-x-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fe7302] focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded py-0.5 w-fit font-medium"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fe7302" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                  <path d="M3 18v-6a9 9 0 0 1 18 0v6"></path>
                  <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path>
                </svg>
                <span>Suporte</span>
              </a>
            </li>
          </ul>
        </div>

        {/* COLUNA 3: CONTATO, WHATSAPP E REDES SOCIAIS */}
        <div className="flex flex-col items-start">
          <h3 className="text-xs font-black uppercase tracking-wider text-white mb-3 md:mb-4">
            Atendimento
          </h3>
          <p className="text-sm text-slate-300 mb-2 md:mb-3">
            Fale com nossa equipe:
          </p>
          <a
            href="https://wa.me/558791425634"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#25D366]/40 text-sm font-semibold text-white hover:text-[#25D366] transition-all group mb-4 md:mb-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="#25D366" className="shrink-0 group-hover:scale-110 transition-transform duration-200">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/>
            </svg>
            <span>Falar no WhatsApp</span>
          </a>

          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-white mb-2.5 md:mb-3">
              Siga-nos nas Redes
            </h4>
            <div className="flex items-center gap-2 flex-wrap">
              <a
                href="https://www.tiktok.com/@camisavetor"
                target="_blank"
                rel="noopener noreferrer"
                title="TikTok"
                className="w-9 h-9 bg-white/5 hover:bg-white/15 border border-white/10 hover:border-[#fe7302]/40 rounded-lg flex items-center justify-center transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fe7302] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              >
                <img src="/tik-tok_branco.png" alt="TikTok" width="18" height="18" className="w-[18px] h-[18px] object-contain block" />
              </a>
              <a
                href="https://www.instagram.com/camisavetor/"
                target="_blank"
                rel="noopener noreferrer"
                title="Instagram"
                className="w-9 h-9 bg-white/5 hover:bg-white/15 border border-white/10 hover:border-[#fe7302]/40 rounded-lg flex items-center justify-center transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fe7302] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              >
                <img src="/instagram_branco.png" alt="Instagram" width="18" height="18" className="w-[18px] h-[18px] object-contain block" />
              </a>
              <a
                href="https://www.youtube.com/@CAMISAVETOR"
                target="_blank"
                rel="noopener noreferrer"
                title="YouTube"
                className="w-9 h-9 bg-white/5 hover:bg-white/15 border border-white/10 hover:border-[#fe7302]/40 rounded-lg flex items-center justify-center transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fe7302] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              >
                <img src="/Youtube_branco.webp" alt="YouTube" width="18" height="18" className="w-[18px] h-[18px] object-contain block" />
              </a>
              <a
                href="https://www.facebook.com/camisavetor"
                target="_blank"
                rel="noopener noreferrer"
                title="Facebook"
                className="w-9 h-9 bg-white/5 hover:bg-white/15 border border-white/10 hover:border-[#fe7302]/40 rounded-lg flex items-center justify-center transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fe7302] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              >
                <img src="/facebook_branco.webp" alt="Facebook" width="18" height="18" className="w-[18px] h-[18px] object-contain block" />
              </a>
              <a
                href="https://wa.me/558791425634"
                target="_blank"
                rel="noopener noreferrer"
                title="WhatsApp"
                className="w-9 h-9 bg-white/5 hover:bg-white/15 border border-white/10 hover:border-[#fe7302]/40 rounded-lg flex items-center justify-center transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fe7302] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              >
                <img src="/whatsapp_branco.png" alt="WhatsApp" width="18" height="18" className="w-[18px] h-[18px] object-contain block" />
              </a>
              <a
                href="https://br.pinterest.com/camisavetor/"
                target="_blank"
                rel="noopener noreferrer"
                title="Pinterest"
                className="w-9 h-9 bg-white/5 hover:bg-white/15 border border-white/10 hover:border-[#fe7302]/40 rounded-lg flex items-center justify-center transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fe7302] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              >
                <img src="/pinterest_branco.webp" alt="Pinterest" width="18" height="18" className="w-[18px] h-[18px] object-contain block" />
              </a>
            </div>
          </div>
        </div>

        {/* COLUNA 4: FORMAS DE PAGAMENTO E ENTREGA DIGITAL */}
        <div className="flex flex-col items-start">
          <h3 className="text-xs font-black uppercase tracking-wider text-white mb-3 md:mb-4">
            Pagamento Seguro
          </h3>
          <div className="flex items-center gap-2.5 flex-wrap mb-3.5 md:mb-5">
            <div className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
              <img
                src="/icon_pix_b.svg"
                alt="Pix"
                style={{ filter: 'brightness(0) invert(1)' }}
                className="h-5 w-auto object-contain opacity-90 hover:opacity-100 transition-opacity"
              />
            </div>
            <div className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
              <img
                src="/mercadopago.svg"
                alt="Mercado Pago"
                style={{ filter: 'brightness(0) invert(1)' }}
                className="h-5 w-auto object-contain opacity-90 hover:opacity-100 transition-opacity"
              />
            </div>
            <div className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
              <img
                src="/PayPal.png"
                alt="PayPal"
                style={{ filter: 'brightness(0) invert(1)' }}
                className="h-5 w-auto object-contain opacity-90 hover:opacity-100 transition-opacity"
              />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 text-xs text-slate-300 leading-relaxed w-full">
            <p className="font-semibold text-white mb-1 flex items-center gap-1.5">
              <span className="text-[#fe7302] text-sm">⚡</span>
              Entrega Digital Imediata
            </p>
            <p className="text-slate-400">
              Arquivos liberados para download automaticamente após a confirmação do pagamento.
            </p>
          </div>
        </div>

      </div>

      {/* BLOCO INFERIOR: COPYRIGHT, AVISO E LINK SECUNDÁRIO RETRÔ */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 pb-28 lg:py-5 flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4 text-xs text-slate-400 text-center md:text-left">
          <div className="space-y-0.5">
            <p className="font-semibold text-slate-300">
              © {currentYear} Camisa Vetor. {t('allRightsReserved')}.
            </p>
            <p className="text-slate-400">
              Produtos 100% digitais — Entrega imediata após a confirmação do pagamento.
            </p>
          </div>

          {/* Link Discreto Modo RetrÔ */}
          <Link
            href="/xp"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-[#fe7302] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#fe7302] rounded px-2.5 py-1 bg-white/[0.02] hover:bg-white/5 border border-white/5"
            title="Experimente nossa interface retrô inspirada no Windows XP"
          >
            <span>💾</span>
            <span>Modo Retrô: Windows XP Edition</span>
          </Link>
        </div>
      </div>
    </footer>
  );
}
