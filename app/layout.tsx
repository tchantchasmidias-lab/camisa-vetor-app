import { Inter } from 'next/font/google';
import { Suspense } from 'react'; // Importação essencial para evitar erro 500/Tela Branca
import dynamic from 'next/dynamic';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MainContainer from '@/components/MainContainer';
import { GeoProvider } from '@/lib/i18n/GeoContext';

const PwaInit = dynamic(() => import('@/components/PwaInit'), { ssr: false });
const PwaInstallBanner = dynamic(() => import('@/components/PwaInstallBanner'), { ssr: false });
const ChunkErrorHandler = dynamic(() => import('@/components/ChunkErrorHandler'), { ssr: false });

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
  title: 'Camisa Vetor | Artes e Vetores Editáveis para Sublimação',
  description: 'Compre e baixe artes vetoriais profissionais editáveis em CorelDraw, PDF e SVG. Estampas exclusivas para sublimação, camisas personalizadas e eventos com download imediato.',
  keywords: [
    'vetor camisa',
    'artes para sublimação',
    'estampas editáveis coreldraw',
    'vetor interclasse',
    'camisa personalizada vetor',
    'download vetor sublimação',
    'estampa religiosa vetor',
    'vetor gospel',
    'vetor futebol'
  ],
  metadataBase: new URL('https://camisavetor.com.br'),
  alternates: {
    canonical: 'https://camisavetor.com.br',
  },
  verification: {
    google: 'google132aa16ad0af4cd4',
    other: {
      'p:domain_verify': '788d73b308d72aa601b7864641f7218a',
    },
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
    title: 'Camisa Vetor | Artes e Vetores Editáveis para Sublimação',
    description: 'Vetores profissionais e editáveis em CorelDraw, PDF e SVG para sublimação e estamparia.',
    url: 'https://camisavetor.com.br',
    siteName: 'Camisa Vetor',
    locale: 'pt_BR',
    type: 'website',
    images: [
      {
        url: 'https://camisavetor.com.br/icon.png',
        width: 512,
        height: 512,
        alt: 'Camisa Vetor — Artes e Vetores Editáveis para Sublimação',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Camisa Vetor | Artes e Vetores Editáveis para Sublimação',
    description: 'Compre e baixe artes vetoriais profissionais editáveis em CorelDraw, PDF e SVG.',
    images: ['https://camisavetor.com.br/icon.png'],
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black' as const,
    title: 'Camisa Vetor',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '48x48' },
      { url: '/icon-48.png', sizes: '48x48', type: 'image/png' },
      { url: '/icon-96.png', sizes: '96x96', type: 'image/png' },
      { url: '/icon-144.png', sizes: '144x144', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon.png', sizes: '192x192', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
};

const structuredData = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    'name': 'Camisa Vetor',
    'url': 'https://camisavetor.com.br',
    'description': 'Compre e baixe artes vetoriais profissionais editáveis em CorelDraw, PDF e SVG para sublimação.',
    'potentialAction': {
      '@type': 'SearchAction',
      'target': {
        '@type': 'EntryPoint',
        'urlTemplate': 'https://camisavetor.com.br/?search={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'OnlineStore',
    'name': 'Camisa Vetor',
    'url': 'https://camisavetor.com.br',
    'logo': 'https://camisavetor.com.br/icon-192.png',
    'image': 'https://camisavetor.com.br/icon.png',
    'description': 'Plataforma de venda e download imediato de artes e vetores profissionais para estamparia e sublimação.',
    'priceRange': '$$',
    'currenciesAccepted': 'BRL, USD, EUR',
    'paymentAccepted': 'Pix, Credit Card, PayPal',
    'contactPoint': {
      '@type': 'ContactPoint',
      'contactType': 'customer service',
      'email': 'camisavetor@gmail.com',
      'telephone': '+55-87-99142-5634',
      'availableLanguage': ['Portuguese', 'English', 'Spanish'],
    },
  },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-br" className={inter.className}>
      <head>
        {/* Favicon & Google Search Icon (Múltiplos de 48px conforme diretrizes oficiais do Google Search) */}
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="icon" href="/favicon.ico" sizes="48x48" />
        <link rel="icon" type="image/png" sizes="48x48" href="/icon-48.png" />
        <link rel="icon" type="image/png" sizes="96x96" href="/icon-96.png" />
        <link rel="icon" type="image/png" sizes="144x144" href="/icon-144.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icon-192.png" />

        {/* Otimização de Conexão (Preconnect & DNS Prefetch para Firebase Storage) */}
        <link rel="preconnect" href="https://firebasestorage.googleapis.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://firebasestorage.googleapis.com" />
        <link rel="preconnect" href="https://firebasestorage.app" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://firebasestorage.app" />
        <link rel="preconnect" href="https://storage.googleapis.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://storage.googleapis.com" />

        <meta name="p:domain_verify" content="788d73b308d72aa601b7864641f7218a" />
        {/* Schema.org WebSite & Organization/OnlineStore para Sitelinks e Rich Snippets */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        {/* Google Tag (gtag.js) - Carregamento diferido para não bloquear a thread principal */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=GT-MJKT5LH7"
          strategy="lazyOnload"
        />
        <Script id="google-gtag" strategy="lazyOnload">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'GT-MJKT5LH7');
          `}
        </Script>
      </head>
      <body className="antialiased text-[#4a4a4a] bg-white selection:bg-orange-50 selection:text-[#fe7302]">
        {/* Tratamento automático de ChunkLoadError pós-deploy */}
        <ChunkErrorHandler />
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