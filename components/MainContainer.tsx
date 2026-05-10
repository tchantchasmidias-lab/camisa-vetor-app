'use client';

import { usePathname } from 'next/navigation';

export default function MainContainer({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname === '/admin';

  return (
    <main className={`min-h-screen ${isAdmin ? 'pl-0 bg-[#050505]' : 'md:pl-20 bg-white'}`}>
      {children}
    </main>
  );
}
