'use client';

import { usePathname } from 'next/navigation';

export default function MainContainer({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin  = pathname === '/admin';
  const isStudio = pathname.startsWith('/studio');

  // Studio é full-screen — remove qualquer padding/margin/bg do container global
  if (isStudio) {
    return <>{children}</>;
  }

  return (
    <main className={`min-h-screen ${isAdmin ? 'bg-[#050505]' : 'bg-white'}`}>
      {children}
    </main>
  );
}
