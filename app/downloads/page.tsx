'use client';

import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { Download, ChevronLeft, Search, FileArchive, Loader2, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useGeo } from '@/lib/i18n/GeoContext';

interface DownloadableItem {
  id: string;
  name: string;
  format: string[];
  image: string;
  downloadUrl: string;
}

export default function DownloadsPage() {
  const [user, setUser] = useState<any>(null);
  const [arquivos, setArquivos] = useState<DownloadableItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const { t, tp } = useGeo();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchUserDownloads(currentUser.uid);
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // BUSCA OS DOWNLOADS REAIS NO FIRESTORE
  const fetchUserDownloads = async (uid: string) => {
    try {
      // Aqui buscamos na coleção 'pedidos' onde o status é 'pago'
      const q = query(
        collection(db, 'pedidos'),
        where('userId', '==', uid),
        where('status', '==', 'pago')
      );
      
      const querySnapshot = await getDocs(q);
      const boughtItemIds = new Set<string>();
      const itemsMap = new Map<string, any>();

      querySnapshot.forEach((docSnap) => {
        const orderData = docSnap.data();
        orderData.items.forEach((item: any) => {
          boughtItemIds.add(item.id);
          if (!itemsMap.has(item.id)) {
             itemsMap.set(item.id, {
               id: item.id,
               name: item.name,
               image: item.image,
             });
          }
        });
      });

      const allProducts: DownloadableItem[] = [];

      for (const pid of boughtItemIds) {
        try {
          const pRef = doc(db, 'products', pid);
          const pSnap = await getDoc(pRef);
          const basicInfo = itemsMap.get(pid);

          if (pSnap.exists()) {
            const data = pSnap.data();
            allProducts.push({
              id: pid,
              name: data.name || basicInfo.name,
              format: data.formats || ['CDR'],
              image: data.urls?.capa || data.images?.[0] || data.image || basicInfo.image,
              downloadUrl: data.urls?.download || data.downloadUrl || data.fileUrl || '#'
            });
          } else {
            allProducts.push({
              id: pid,
              name: basicInfo.name,
              format: ['CDR'],
              image: basicInfo.image,
              downloadUrl: '#'
            });
          }
        } catch (e) {
          console.error("Erro ao buscar produto", pid, e);
        }
      }

      setArquivos(allProducts);
    } catch (error) {
      console.error("Erro ao buscar downloads:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredFiles = arquivos.filter(file => 
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-[#fe7302] mb-4" size={32} />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">{t('preparingFiles')}...</p>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen animate-in fade-in duration-500">
      <main className="pt-8 md:pt-12 pb-20 px-4">
        <div className="max-w-6xl mx-auto">
         
          {/* NAVEGAÇÃO E BUSCA */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <Link href="/perfil" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 hover:text-[#fe7302] transition-all group">
              <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
              {t('backToProfile')}
            </Link>

            <div className="relative w-full md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('searchInFilesPlaceholder')}
                className="w-full pl-12 pr-4 py-3 bg-[#fbfbfb] border border-gray-100 rounded-2xl text-[9px] font-black uppercase tracking-widest outline-none focus:border-[#fe7302] transition-all"
              />
            </div>
          </div>

          {/* TÍTULO */}
          <div className="mb-12 border-b border-gray-50 pb-8 flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-[#fe7302]">
                <FileArchive size={24} />
            </div>
            <div>
                <h1 className="text-2xl font-black uppercase tracking-tighter text-gray-900">
                  {t('myDownloadsTitle')} <span className="text-[#fe7302]">{t('myDownloadsTitleHighlight')}</span>
                </h1>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                    {t('filesReleased')}
                </p>
            </div>
          </div>

          {!user ? (
            <div className="text-center py-20 bg-gray-50 rounded-[2.5rem] border border-dashed border-gray-200">
               <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6">{t('loginRequiredDownloads')}</p>
               <Link href="/perfil" className="bg-black text-white px-8 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#fe7302] transition-all">{t('loginAction')}</Link>
            </div>
          ) : filteredFiles.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFiles.map((file, index) => (
                <div key={index} className="group bg-[#141414] border border-[#2a2a2a] rounded-[2rem] p-4 flex gap-5 transition-all duration-500 hover:shadow-2xl hover:shadow-orange-900/20 hover:-translate-y-1 hover:border-[#fe7302]/50">
                 
                  {/* MINIATURA OTIMIZADA */}
                  <div className="w-24 h-32 bg-[#202020] rounded-2xl overflow-hidden flex-shrink-0 relative border border-[#2a2a2a]">
                    <Image 
                        src={file.image} 
                        alt={file.name} 
                        fill 
                        className="object-cover transition-transform duration-700 group-hover:scale-110" 
                    />
                  </div>

                  {/* INFO E DOWNLOAD */}
                  <div className="flex flex-col justify-between py-1 flex-1">
                    <div>
                      <h3 className="text-[10px] font-black uppercase tracking-tight text-white leading-tight mb-3 group-hover:text-[#fe7302] transition-colors">
                        {tp(file.name)}
                      </h3>
                      <div className="flex flex-wrap gap-1.5">
                        {file.format.map(fmt => (
                            <span key={fmt} className="text-[8px] font-black px-2 py-0.5 bg-[#202020] border border-[#2a2a2a] text-gray-400 rounded uppercase">
                                {fmt}
                            </span>
                        ))}
                      </div>
                    </div>

                    <a 
                      href={file.downloadUrl} 
                      download
                      className="w-full bg-[#fe7302] text-white py-3.5 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest hover:bg-[#56c271] transition-all duration-300 active:scale-95"
                    >
                      <Download size={14} />
                      {t('downloadAction')}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-32 text-center animate-in zoom-in duration-700">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                <ShoppingCart size={30} className="text-gray-200 stroke-[1.5px]" />
              </div>
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em] mb-8">{t('noFilesFound')}</p>
              <Link href="/" className="border border-gray-200 text-gray-800 px-10 py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-[9px] hover:bg-black hover:text-white transition-all">
                {t('goToShop')}
              </Link>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}