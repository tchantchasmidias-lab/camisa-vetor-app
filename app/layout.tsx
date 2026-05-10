import { Inter } from 'next/font/google';
import { Suspense } from 'react'; // Importação essencial para evitar erro 500/Tela Branca
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MainContainer from '@/components/MainContainer';
import { GeoProvider } from '@/lib/i18n/GeoContext';

// Configuração da fonte Inter (Padrão Google Premium)
const inter = Inter({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});

export const metadata = {
  title: 'Camisa Vetor | Vetores Profissionais',
  description: 'Os melhores vetores para estamparia e sublimação.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-br" className={inter.className}>
      {/* 
        text-[#4a4a4a] é o cinza grafite (70% preto).
        antialiased deixa a fonte mais elegante e leve.
        selection: muda a cor de quando o usuário seleciona um texto com o mouse.
      */}
      <body className="antialiased text-[#4a4a4a] bg-white selection:bg-orange-50 selection:text-[#fe7302]">
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