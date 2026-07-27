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
    <footer className="bg-white border-t border-gray-100 mt-4 md:mt-20">

      {/* BLOCO SUPERIOR: IDENTIDADE E CONTATO */}
      <div className="max-w-7xl mx-auto px-4 pt-8 pb-5 grid grid-cols-1 md:grid-cols-3 gap-6 border-b border-gray-100">

        {/* SOBRE A LOJA */}
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#202124] block mb-2">
            Camisa Vetor
          </span>
          <p className="text-[11px] text-gray-400 leading-relaxed">
            Plataforma brasileira de vetores profissionais para estamparia, sublimação e personalização de produtos.
          </p>
        </div>

        {/* LINKS */}
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#202124] block mb-2">
            Links
          </span>
          <nav className="flex flex-col gap-1.5">
            <Link href="/sobre" className="text-[11px] text-gray-400 hover:text-[#fe7302] transition-colors uppercase tracking-widest font-bold">
              Sobre Nós
            </Link>
            <Link href="/termos" className="text-[11px] text-gray-400 hover:text-[#fe7302] transition-colors uppercase tracking-widest font-bold">
              {t('termsOfUse')}
            </Link>
            <Link href="/privacidade" className="text-[11px] text-gray-400 hover:text-[#fe7302] transition-colors uppercase tracking-widest font-bold">
              {t('privacyPolicy')}
            </Link>
            <Link href="https://wa.me/558791425634" target="_blank" className="text-[11px] text-gray-400 hover:text-[#fe7302] transition-colors uppercase tracking-widest font-bold">
              {t('support')}
            </Link>
          </nav>
        </div>

        {/* CONTATO */}
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#202124] block mb-2">
            Contato
          </span>
          <div className="flex flex-col gap-2">
            <a
              href="mailto:contato@camisavetor.com"
              className="flex items-center gap-2 text-[11px] text-gray-400 hover:text-[#fe7302] transition-colors font-medium"
            >
              <Mail size={12} className="text-[#fe7302] flex-shrink-0" />
              contato@camisavetor.com
            </a>
            <div className="flex items-start gap-2 text-[11px] text-gray-400 font-medium">
              <MapPin size={12} className="text-[#fe7302] flex-shrink-0 mt-0.5" />
              <span>Rua Marieta Pita, nº 09<br />Loteamento José Gerônimo<br />Pesqueira — PE, Brasil</span>
            </div>
          </div>
        </div>

      </div>

      {/* BLOCO INFERIOR: COPYRIGHT */}
      <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center gap-2">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] text-center md:text-left">
          © {currentYear} CAMISA VETOR. {t('allRightsReserved')}.
        </p>
        <p className="text-[10px] text-gray-300 text-center">
          Produtos digitais — Entrega imediata após pagamento
        </p>
      </div>

    </footer>
  );
}