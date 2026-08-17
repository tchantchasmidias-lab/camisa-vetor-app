'use client';

import { usePathname } from 'next/navigation';
import { useGeo } from '@/lib/i18n/GeoContext';
import Link from 'next/link';
import { Mail, MapPin } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const { t } = useGeo();
  const pathname = usePathname();

  if (pathname === '/admin') return null;

  return (
    <footer className="bg-[#0a0a0a] border-t border-white/5 mt-4 md:mt-20 text-white font-sans">

      {/* BLOCO SUPERIOR: IDENTIDADE, LINKS E CONTATO/REDES/PAGAMENTO */}
      <div className="max-w-7xl mx-auto px-4 pt-10 pb-8 grid grid-cols-1 md:grid-cols-3 gap-8 border-b border-white/5">

        {/* SOBRE A LOJA */}
        <div>
          <span className="text-[11px] font-black uppercase tracking-[0.25em] text-white block mb-3">
            Camisa Vetor
          </span>
          <p className="footer-about-text text-[12px] text-white leading-relaxed mb-4">
            Plataforma brasileira de vetores profissionais para estamparia, sublimação e personalização de produtos.
          </p>
          <div className="flex flex-col gap-2">
            <a
              href="mailto:contato@camisavetor.com"
              className="footer-contact-info flex items-center gap-2 text-[12px] text-white hover:text-[#fe7302] transition-colors font-medium"
            >
              <Mail size={14} className="footer-contact-icon text-[#fe7302] stroke-[#fe7302] flex-shrink-0" />
              contato@camisavetor.com
            </a>
            <div className="footer-address flex items-start gap-2 text-[12px] text-white font-medium">
              <MapPin size={14} className="footer-contact-icon text-[#fe7302] stroke-[#fe7302] flex-shrink-0 mt-0.5" />
              <span>Rua Marieta Pita, nº 09<br />Loteamento José Gerônimo<br />Pesqueira — PE, Brasil</span>
            </div>
          </div>
        </div>

        {/* LINKS */}
        <div>
          <span className="text-[11px] font-black uppercase tracking-[0.25em] text-white block mb-3">
            Links
          </span>
          <ul className="footer-links-list flex flex-col gap-[10px] p-0 m-0 list-none">
            <li>
              <Link href="/blog" className="footer-nav-link inline-flex items-center gap-2 text-white no-underline text-[13px] font-medium transition-all duration-200 hover:text-[#fe7302] hover:translate-x-[3px]">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fe7302" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="footer-nav-icon shrink-0 transition-transform duration-200">
                  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"></path>
                  <path d="M6 6h10"></path>
                  <path d="M6 10h10"></path>
                </svg>
                <span>BLOG</span>
              </Link>
            </li>
            <li>
              <Link href="/sobre" className="footer-nav-link inline-flex items-center gap-2 text-white no-underline text-[13px] font-medium transition-all duration-200 hover:text-[#fe7302] hover:translate-x-[3px]">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fe7302" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="footer-nav-icon shrink-0 transition-transform duration-200">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                <span>SOBRE NÓS</span>
              </Link>
            </li>
            <li>
              <Link href="/termos" className="footer-nav-link inline-flex items-center gap-2 text-white no-underline text-[13px] font-medium transition-all duration-200 hover:text-[#fe7302] hover:translate-x-[3px]">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fe7302" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="footer-nav-icon shrink-0 transition-transform duration-200">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                <span>TERMOS DE USO</span>
              </Link>
            </li>
            <li>
              <Link href="/privacidade" className="footer-nav-link inline-flex items-center gap-2 text-white no-underline text-[13px] font-medium transition-all duration-200 hover:text-[#fe7302] hover:translate-x-[3px]">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fe7302" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="footer-nav-icon shrink-0 transition-transform duration-200">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
                <span>PRIVACIDADE</span>
              </Link>
            </li>
            <li>
              <Link href="https://wa.me/558791425634" target="_blank" className="footer-nav-link inline-flex items-center gap-2 text-white no-underline text-[13px] font-medium transition-all duration-200 hover:text-[#fe7302] hover:translate-x-[3px]">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fe7302" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="footer-nav-icon shrink-0 transition-transform duration-200">
                  <path d="M3 18v-6a9 9 0 0 1 18 0v6"></path>
                  <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path>
                </svg>
                <span>SUPORTE</span>
              </Link>
            </li>
          </ul>
        </div>

        {/* COLUNA CONTATO, REDES SOCIAIS & PAGAMENTO SEGURO */}
        <div className="footer-column footer-contact-social">
          
          {/* Seção Contato */}
          <h4 className="footer-title text-[15px] font-bold text-white mt-0 mb-3 block">
            Contato
          </h4>
          <ul className="footer-list space-y-2 mb-5">
            <li className="footer-schedule text-[13px] text-white block">
              Atendimento: Todos os dias 24hs
            </li>
            <li>
              <a
                href="https://wa.me/558791425634"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-link-wpp inline-flex items-center text-[13px] text-white hover:text-[#25D366] transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#25D366" className="mr-1.5 shrink-0">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/>
                </svg>
                <span>Falar no WhatsApp</span>
              </a>
            </li>
          </ul>

          {/* Seção Redes Sociais */}
          <h4 className="footer-title text-[15px] font-bold text-white mt-4 mb-3 block">
            Siga-nos nas Redes Sociais
          </h4>
          <div className="footer-social-icons flex items-center gap-2 mb-5">
            <a href="https://www.tiktok.com/@camisavetor" target="_blank" rel="noopener noreferrer" title="TikTok" className="social-icon-link w-[34px] h-[34px] bg-white/10 hover:bg-white/20 rounded-md flex items-center justify-center transition-all hover:-translate-y-0.5">
              <img src="/tik-tok_branco.png" alt="TikTok" width="20" height="20" className="w-5 h-5 object-contain block" />
            </a>
            <a href="https://www.instagram.com/camisavetor/" target="_blank" rel="noopener noreferrer" title="Instagram" className="social-icon-link w-[34px] h-[34px] bg-white/10 hover:bg-white/20 rounded-md flex items-center justify-center transition-all hover:-translate-y-0.5">
              <img src="/instagram_branco.png" alt="Instagram" width="20" height="20" className="w-5 h-5 object-contain block" />
            </a>
            <a href="https://www.youtube.com/@CAMISAVETOR" target="_blank" rel="noopener noreferrer" title="YouTube" className="social-icon-link w-[34px] h-[34px] bg-white/10 hover:bg-white/20 rounded-md flex items-center justify-center transition-all hover:-translate-y-0.5">
              <img src="/Youtube_branco.webp" alt="YouTube" width="20" height="20" className="w-5 h-5 object-contain block" />
            </a>
            <a href="https://www.facebook.com/camisavetor" target="_blank" rel="noopener noreferrer" title="Facebook" className="social-icon-link w-[34px] h-[34px] bg-white/10 hover:bg-white/20 rounded-md flex items-center justify-center transition-all hover:-translate-y-0.5">
              <img src="/facebook_branco.webp" alt="Facebook" width="20" height="20" className="w-5 h-5 object-contain block" />
            </a>
            <a href="https://wa.me/558791425634" target="_blank" rel="noopener noreferrer" title="WhatsApp" className="social-icon-link w-[34px] h-[34px] bg-white/10 hover:bg-white/20 rounded-md flex items-center justify-center transition-all hover:-translate-y-0.5">
              <img src="/whatsapp_branco.png" alt="WhatsApp" width="20" height="20" className="w-5 h-5 object-contain block" />
            </a>
            <a href="https://br.pinterest.com/camisavetor/" target="_blank" rel="noopener noreferrer" title="Pinterest" className="social-icon-link w-[34px] h-[34px] bg-white/10 hover:bg-white/20 rounded-md flex items-center justify-center transition-all hover:-translate-y-0.5">
              <img src="/pinterest_branco.webp" alt="Pinterest" width="20" height="20" className="w-5 h-5 object-contain block" />
            </a>
          </div>

          {/* Seção Pagamento Seguro */}
          <h4 className="footer-title text-[15px] font-bold text-white mt-4 mb-3 block">
            Pagamento seguro
          </h4>
          <div className="footer-payment-icons flex items-center gap-3 flex-wrap">
            <img src="/icon_pix_b.svg" alt="Pix" style={{ filter: 'brightness(0) invert(1)' }} className="payment-icon h-[24px] w-auto object-contain opacity-90 hover:opacity-100 transition-opacity" />
            <img src="/mercadopago.svg" alt="Mercado Pago" style={{ filter: 'brightness(0) invert(1)' }} className="payment-icon h-[24px] w-auto object-contain opacity-90 hover:opacity-100 transition-opacity" />
            <img src="/PayPal.png" alt="PayPal" style={{ filter: 'brightness(0) invert(1)' }} className="payment-icon h-[24px] w-auto object-contain opacity-90 hover:opacity-100 transition-opacity" />
          </div>

        </div>

      </div>

      {/* BLOCO INFERIOR: COPYRIGHT */}
      <div className="footer-bottom max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center gap-2 text-white opacity-90">
        <p className="footer-copyright text-[10px] font-bold uppercase tracking-[0.2em] text-center md:text-left text-white">
          © {currentYear} CAMISA VETOR. {t('allRightsReserved')}.
        </p>
        <p className="footer-bottom-notice text-[10px] text-center text-white">
          Produtos digitais — Entrega imediata após pagamento
        </p>
      </div>

    </footer>
  );
}