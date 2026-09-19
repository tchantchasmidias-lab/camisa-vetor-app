'use client';

import { usePathname } from 'next/navigation';

export default function MainContainer({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin  = pathname === '/admin';
  const isStudio = pathname.startsWith('/studio');
  const isXP     = pathname.startsWith('/xp');

  // Studio e XP são full-screen — remove qualquer padding/margin/bg do container global
  if (isStudio || isXP) {
    return <>{children}</>;
  }

  return (
    <main className={`min-h-screen ${isAdmin ? 'bg-[#050505]' : 'bg-white'}`}>
      {children}
    </main>
  );
}
