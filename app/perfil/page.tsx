'use client';

import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { 
  Package, Heart, Settings, LogOut, 
  ChevronRight, Download, User as UserIcon, Loader2 
} from 'lucide-react';
import Link from 'next/link';
import { useGeo } from '@/lib/i18n/GeoContext';

export default function PerfilPage() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  
  const { t } = useGeo();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push('/login');
      } else {
        setUser(currentUser);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error("Erro ao sair:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <Loader2 className="animate-spin text-[#fe7302] mb-4" size={32} />
        <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-[#5f6368]">{t('syncing')}...</p>
      </div>
    );
  }

  // Prevenir renderização da página se não houver usuário logado
  if (!user) {
    return null;
  }

  const menuItems = [
    {
      title: t('navOrders'),
      desc: t('navOrdersDesc'),
      icon: <Package size={22} />,
      link: "/pedidos",
      bg: "bg-blue-50",
      color: "text-blue-600"
    },
    {
      title: t('navDownloads'),
      desc: t('navDownloadsDesc'),
      icon: <Download size={22} />,
      link: "/downloads",
      bg: "bg-green-50",
      color: "text-green-600"
    },
    {
      title: t('navFavorites'),
      desc: t('navFavoritesDesc'),
      icon: <Heart size={22} />,
      link: "/favoritos",
      bg: "bg-orange-50",
      color: "text-[#fe7302]"
    },
    {
      title: t('navSettings'),
      desc: t('navSettingsDesc'),
      icon: <Settings size={22} />,
      link: "/configuracoes",
      bg: "bg-gray-100",
      color: "text-gray-600"
    }
  ];

  return (
    <div className="bg-white min-h-screen font-sans text-[#4a4a4a] animate-in fade-in duration-700">
      <main className="pt-16 md:pt-4 pb-20 px-4">
        <div className="max-w-5xl mx-auto">
          
          {/* HEADER DO PERFIL */}
          <div className="flex flex-col items-center text-center mb-16">
            <div className="relative mb-6">
              <div className="w-28 h-28 md:w-32 md:h-32 bg-[#f8f9fa] rounded-full border border-[#dadce0] flex items-center justify-center shadow-inner">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="Perfil" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <UserIcon size={48} className="text-[#dadce0]" />
                )}
              </div>
              <div className="absolute bottom-1 right-1 w-8 h-8 bg-[#fe7302] rounded-full border-4 border-white flex items-center justify-center shadow-lg">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              </div>
            </div>
            
            <h1 className="text-2xl md:text-3xl font-semibold text-[#202124] uppercase tracking-tight">
              {user?.displayName || t('defaultUser')}
            </h1>
            <p className="text-sm text-[#5f6368] font-medium mt-1 mb-4">{user?.email}</p>
            
            <span className="px-4 py-1.5 bg-[#f8f9fa] border border-[#dadce0] text-[#5f6368] text-[10px] font-bold uppercase tracking-widest rounded-full">
               {t('accountVerified')}
            </span>
          </div>

          {/* GRID DE SERVIÇOS DO CLIENTE */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {menuItems.map((item, index) => (
              <Link
                key={index}
                href={item.link}
                className="group flex items-center justify-between p-8 bg-white border border-[#dadce0] rounded-[2rem] hover:border-[#fe7302] hover:shadow-xl hover:shadow-gray-100 transition-all duration-500"
              >
                <div className="flex items-center gap-6">
                  <div className={`p-4 rounded-2xl ${item.bg} ${item.color} transition-transform group-hover:scale-110 duration-500`}>
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-widest text-[#202124]">{item.title}</h3>
                    <p className="text-[12px] text-[#5f6368] font-medium mt-1 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-[#f8f9fa] flex items-center justify-center group-hover:bg-[#fe7302] transition-colors">
                  <ChevronRight size={18} className="text-[#dadce0] group-hover:text-white transition-colors" />
                </div>
              </Link>
            ))}
          </div>

          {/* BOTÃO DE SAÍDA */}
          <div className="mt-20 flex flex-col items-center">
            <button 
              onClick={handleLogout}
              className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.3em] text-[#5f6368] hover:text-red-500 transition-all group"
            >
              <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
              {t('logout')}
            </button>
            <div className="w-20 h-[1px] bg-[#dadce0] mt-6" />
          </div>

        </div>
      </main>
    </div>
  );
}