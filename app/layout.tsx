import { Inter } from 'next/font/google';
import { Suspense } from 'react'; // Importação essencial para evitar erro 500/Tela Branca
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MainContainer from '@/components/MainContainer';
import { GeoProvider } from '@/lib/i18n/GeoContext';
import PwaInit from '@/components/PwaInit';
import PwaInstallBanner from '@/components/PwaInstallBanner';

import Script from 'next/script';

// Configuração da fonte Inter (Padrão Google Premium)
const inter = Inter({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#fe7302',
};

export const metadata = {
  title: 'Camisa Vetor | Vetores Profissionais para Estamparia',
  description: 'Baixe vetores profissionais para estamparia e sublimação. Arquivos CDR, PDF, SVG, PNG e AI com qualidade premium. Camisas, times, personagens e muito mais.',
  metadataBase: new URL('https://camisavetor.com.br'),
  alternates: {
    canonical: 'https://camisavetor.com.br',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      maxImagePreview: 'large',
      maxSnippet: -1,
      maxVideoPreview: -1,
    },
  },
  openGraph: {
    title: 'Camisa Vetor | Vetores Profissionais para Estamparia',
    description: 'Baixe vetores profissionais para estamparia e sublimação. Arquivos CDR, PDF, SVG, PNG e AI com qualidade premium.',
    url: 'https://camisavetor.com.br',
    siteName: 'Camisa Vetor',
    locale: 'pt_BR',
    type: 'website',
    images: [
      {
        url: 'https://camisavetor.com.br/icon.png',
        width: 512,
        height: 512,
        alt: 'Camisa Vetor — Vetores Profissionais para Estamparia',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Camisa Vetor | Vetores Profissionais para Estamparia',
    description: 'Baixe vetores profissionais para estamparia e sublimação.',
    images: ['https://camisavetor.com.br/icon.png'],
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black' as const,
    title: 'Camisa Vetor',
  },
  icons: {
    icon: '/icon.png',
    shortcut: '/icon.png',
    apple: '/icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-br" className={inter.className}>
      <head>
        {/* Google Tag (gtag.js) */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=GT-MJKT5LH7"
          strategy="afterInteractive"
        />
        <Script id="google-gtag" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'GT-MJKT5LH7');
          `}
        </Script>
      </head>
      <body className="antialiased text-[#4a4a4a] bg-white selection:bg-orange-50 selection:text-[#fe7302]">
        {/* PWA: Registro do Service Worker e gerenciamento de tokens FCM */}
        <PwaInit />
        {/* PWA: Banner de instalação para Android/Chrome */}
        <PwaInstallBanner />
        <GeoProvider>
          {/* 
              IMPORTANTE: O Header DEVE estar dentro de um Suspense.
              Isso resolve o erro de tela branca causado pelo uso de 'useSearchParams' no Next.js 14.
          */}
          <Suspense fallback={<div className="h-20 bg-white" />}>
            <Header />
          </Suspense>

          {/* Container principal para o conteúdo das páginas */}
          <MainContainer>
            {children}
          </MainContainer>

          <Footer />
        </GeoProvider>
      </body>
    </html>
  );
}