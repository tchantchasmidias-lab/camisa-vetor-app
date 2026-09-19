import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Camisa Vetor — Windows XP Edition',
  description: 'Experiência retrô interativa inspirada no clássico Windows XP para explorar, visualizar e comprar artes vetoriais exclusivas.',
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0055ea',
};

export default function XPLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden bg-[#004e98] text-[#202124] select-none font-sans">
      {children}
    </div>
  );
}
