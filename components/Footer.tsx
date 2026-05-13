'use client';

import { usePathname } from 'next/navigation';
import { useGeo } from '@/lib/i18n/GeoContext';
import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const { t } = useGeo();
  const pathname = usePathname();

  if (pathname === '/admin') return null;

  return (
    <footer className="bg-white border-t border-gray-100 pt-4 pb-10 md:py-10 mt-2 md:mt-20">
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
        
        {/* COPYRIGHT */}
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] text-center md:text-left">
          © {currentYear} CAMISA VETOR. {t('allRightsReserved')}.
        </p>

        {/* LINKS SIMPLES */}
        <nav className="flex items-center space-x-6">
          <Link 
            href="/termos" 
            className="text-[10px] font-bold text-gray-400 hover:text-[#fe7302] transition-colors uppercase tracking-widest"
          >
            {t('termsOfUse')}
          </Link>
          <Link 
            href="/privacidade" 
            className="text-[10px] font-bold text-gray-400 hover:text-[#fe7302] transition-colors uppercase tracking-widest"
          >
            {t('privacyPolicy')}
          </Link>
          <Link 
            href="https://wa.me/558791425634" 
            target="_blank"
            className="text-[10px] font-bold text-gray-400 hover:text-[#fe7302] transition-colors uppercase tracking-widest"
          >
            {t('support')}
          </Link>
        </nav>

      </div>
    </footer>
  );
}