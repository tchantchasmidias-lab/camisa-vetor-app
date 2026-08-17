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
          <p className="text-[12px] text-[#94a3b8] leading-relaxed mb-4">
            Plataforma brasileira de vetores profissionais para estamparia, sublimação e personalização de produtos.
          </p>
          <div className="flex flex-col gap-2">
            <a
              href="mailto:contato@camisavetor.com"
              className="flex items-center gap-2 text-[12px] text-[#94a3b8] hover:text-[#fe7302] transition-colors font-medium"
            >
              <Mail size={14} className="text-[#fe7302] flex-shrink-0" />
              contato@camisavetor.com
            </a>
            <div className="flex items-start gap-2 text-[12px] text-[#94a3b8] font-medium">
              <MapPin size={14} className="text-[#fe7302] flex-shrink-0 mt-0.5" />
              <span>Rua Marieta Pita, nº 09<br />Loteamento José Gerônimo<br />Pesqueira — PE, Brasil</span>
            </div>
          </div>
        </div>

        {/* LINKS */}
        <div>
          <span className="text-[11px] font-black uppercase tracking-[0.25em] text-white block mb-3">
            Links
          </span>
          <nav className="flex flex-col gap-2">
            <Link href="/blog" className="text-[12px] text-[#94a3b8] hover:text-[#fe7302] transition-colors uppercase tracking-widest font-bold">
              Blog
            </Link>
            <Link href="/sobre" className="text-[12px] text-[#94a3b8] hover:text-[#fe7302] transition-colors uppercase tracking-widest font-bold">
              Sobre Nós
            </Link>
            <Link href="/termos" className="text-[12px] text-[#94a3b8] hover:text-[#fe7302] transition-colors uppercase tracking-widest font-bold">
              {t('termsOfUse')}
            </Link>
            <Link href="/privacidade" className="text-[12px] text-[#94a3b8] hover:text-[#fe7302] transition-colors uppercase tracking-widest font-bold">
              {t('privacyPolicy')}
            </Link>
            <Link href="https://wa.me/558791425634" target="_blank" className="text-[12px] text-[#94a3b8] hover:text-[#fe7302] transition-colors uppercase tracking-widest font-bold">
              {t('support')}
            </Link>
          </nav>
        </div>

        {/* COLUNA CONTATO, REDES SOCIAIS & PAGAMENTO SEGURO */}
        <div className="footer-column footer-contact-social">
          
          {/* Seção Contato */}
          <h4 className="footer-title text-[15px] font-bold text-white mt-0 mb-3 block">
            Contato
          </h4>
          <ul className="footer-list space-y-2 mb-5">
            <li>
              <Link href="/contato" className="footer-link text-[13px] text-[#94a3b8] hover:text-[#fe7302] transition-colors block">
                Página de Contato
              </Link>
            </li>
            <li className="footer-info text-[13px] text-[#94a3b8] block">
              Atendimento: Todos os dias 24hs
            </li>
            <li>
              <a
                href="https://wa.me/558791425634"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-link-wpp inline-flex items-center text-[13px] text-[#94a3b8] hover:text-[#25D366] transition-colors"
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
            <img src="/icon_pix_b.svg" alt="Pix" className="payment-icon h-[24px] w-auto object-contain opacity-90 hover:opacity-100 transition-opacity" />
            <img src="/mercadopago.svg" alt="Mercado Pago" className="payment-icon h-[24px] w-auto object-contain opacity-90 hover:opacity-100 transition-opacity" />
            <img src="/PayPal.svg" alt="PayPal" className="payment-icon h-[24px] w-auto object-contain opacity-90 hover:opacity-100 transition-opacity" />
          </div>

        </div>

      </div>

      {/* BLOCO INFERIOR: COPYRIGHT */}
      <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center gap-2">
        <p className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.2em] text-center md:text-left">
          © {currentYear} CAMISA VETOR. {t('allRightsReserved')}.
        </p>
        <p className="text-[10px] text-gray-700 text-center">
          Produtos digitais — Entrega imediata após pagamento
        </p>
      </div>

    </footer>
  );
}