/**
 * Layout isolado do Studio — completamente separado do e-commerce.
 * NÃO importa Header, Footer ou MainContainer.
 */
export const metadata = {
  title: 'Studio | Camisa Vetor',
  description: 'Editor vetorial interno de estampas para camisetas.',
  robots: { index: false, follow: false }, // Studio é privado
};

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // O html/body são herdados do root layout, mas o conteúdo é completamente isolado
    <div className="studio-root h-screen w-screen overflow-hidden bg-[#111418] text-white">
      {children}
    </div>
  );
}
