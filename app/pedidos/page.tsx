'use client';

import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { Package, ChevronLeft, Download, ExternalLink, Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useGeo } from '@/lib/i18n/GeoContext';

interface OrderItem {
  name: string;
  image: string;
  downloadUrl?: string;
}

interface Order {
  id: string;
  createdAt: any;
  status: 'pago' | 'pendente' | 'cancelado';
  total: number;
  items: OrderItem[];
}

export default function PedidosPage() {
  const [user, setUser] = useState<any>(null);
  const [pedidos, setPedidos] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { t, tp, formatPrice } = useGeo();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchOrders(currentUser.uid);
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchOrders = async (uid: string) => {
    try {
      const q = query(
        collection(db, 'pedidos'),
        where('userId', '==', uid),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const ordersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];

      setPedidos(ordersData);
    } catch (error) {
      console.error("Erro ao buscar pedidos:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return t('dateUnavailable');
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatCurrency = (val: number) => formatPrice(val);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-[#fe7302] mb-4" size={32} />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">{t('syncingHistory')}...</p>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen animate-in fade-in duration-500">
      <main className="pt-8 md:pt-12 pb-20 px-4">
        <div className="max-w-4xl mx-auto">
         
          <Link href="/perfil" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 hover:text-[#fe7302] transition-all group mb-10">
            <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            {t('backToProfile')}
          </Link>

          <div className="mb-12">
            <h1 className="text-3xl font-black uppercase tracking-tighter text-gray-900">
              {t('myOrdersTitle')} <span className="text-[#fe7302]">{t('myOrdersTitleHighlight')}</span>
            </h1>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-2">
                {t('trackOrdersDesc')}
            </p>
          </div>

          <div className="space-y-6">
            {!user ? (
               <div className="p-12 text-center bg-gray-50 rounded-[2.5rem] border border-dashed">
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-6">{t('loginRequiredOrders')}</p>
                  <Link href="/perfil" className="bg-black text-white px-8 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest">{t('loginAction')}</Link>
               </div>
            ) : pedidos.length > 0 ? pedidos.map((pedido) => (
              <div key={pedido.id} className="group border border-gray-100 rounded-[2rem] overflow-hidden bg-white hover:shadow-2xl hover:shadow-gray-100 transition-all duration-500">
               
                {/* HEADER DO PEDIDO */}
                <div className="bg-[#fbfbfb] px-6 py-6 border-b border-gray-50 flex flex-wrap items-center justify-between gap-6">
                  <div className="flex gap-8 md:gap-12">
                    <div>
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1.5">{t('orderId')}</p>
                      <p className="text-[11px] font-black text-gray-900 uppercase">#{pedido.id.slice(0, 8)}</p>
                    </div>
                    <div>
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1.5">{t('purchaseDate')}</p>
                      <p className="text-[11px] font-bold text-gray-600">{formatDate(pedido.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1.5">{t('totalValue')}</p>
                      <p className="text-[11px] font-black text-black">{formatCurrency(pedido.total)}</p>
                    </div>
                  </div>

                  <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-[0.1em] ${
                    pedido.status === 'pago' ? 'bg-green-50 text-green-600' : 
                    pedido.status === 'pendente' ? 'bg-orange-50 text-orange-600' : 'bg-red-50 text-red-600'
                  }`}>
                    {pedido.status === 'pago' ? <CheckCircle2 size={12} /> : 
                     pedido.status === 'pendente' ? <Clock size={12} /> : <XCircle size={12} />}
                    {t(`status${pedido.status.charAt(0).toUpperCase() + pedido.status.slice(1)}`)}
                  </div>
                </div>

                {/* ITENS DO PEDIDO */}
                <div className="p-6 md:p-8 space-y-6">
                  {pedido.items.map((item, idx) => (
                    <div key={idx} className="flex flex-col md:flex-row md:items-center gap-6">
                      <div className="w-20 h-20 rounded-2xl overflow-hidden border border-gray-50 flex-shrink-0 relative">
                        <Image src={item.image} alt={item.name} fill className="object-cover" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-[11px] font-black uppercase tracking-widest text-gray-800 leading-tight mb-4">
                          {tp(item.name)}
                        </h4>
                       
                        {pedido.status === 'pago' ? (
                          <div className="flex flex-wrap gap-3">
                            <Link 
                              href="/downloads" 
                              className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-black text-white px-5 py-3 rounded-xl hover:bg-[#fe7302] transition-all shadow-lg shadow-gray-200 active:scale-95"
                            >
                              <Download size={14} />
                              {t('downloadVector')}
                            </Link>
                            <button className="text-[9px] font-bold text-gray-300 hover:text-black uppercase tracking-widest transition-colors flex items-center gap-2">
                              <ExternalLink size={14} />
                              {t('orderNote')}
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-2 px-3 py-2 bg-orange-50/50 rounded-lg">
                            <Clock size={12} className="text-orange-600 animate-pulse" />
                            <p className="text-[9px] font-bold text-orange-800 uppercase tracking-widest">
                                {t('waitingCompensation')}...
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <Package size={48} className="text-gray-100 mb-6 stroke-[1px]" />
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em] mb-10">{t('noOrdersFound')}</p>
                <Link href="/" className="bg-[#fe7302] text-white px-10 py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-orange-100">
                  {t('startShopping')}
                </Link>
              </div>
            )}
          </div>

          <div className="mt-20 p-10 rounded-[2.5rem] bg-[#fbfbfb] border border-gray-100 flex flex-col items-center text-center">
             <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-[#fe7302] mb-6">
                <Package size={24} />
             </div>
             <h3 className="text-[11px] font-black uppercase tracking-[0.2em] mb-2">{t('customerSupportTitle')}</h3>
             <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-8 max-w-[280px]">{t('customerSupportDesc')}</p>
             <a href="https://wa.me/558791425634" target="_blank" rel="noopener noreferrer" className="text-[10px] font-black uppercase tracking-[0.3em] text-[#fe7302] border-b-2 border-[#fe7302] pb-1 hover:text-black hover:border-black transition-all">
               {t('contactWhatsApp')}
             </a>
          </div>

        </div>
      </main>
    </div>
  );
}