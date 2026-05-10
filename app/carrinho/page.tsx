'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Trash2, ShoppingCart, ArrowRight, ChevronLeft } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useGeo } from '@/lib/i18n/GeoContext';

interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

function CarrinhoContent() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  
  const { t, tp, formatPrice, isLoading: loadingGeo } = useGeo();

  useEffect(() => {
    const savedCart = JSON.parse(localStorage.getItem('camisavetor_cart') || '[]');
    setCartItems(savedCart);

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  const updateCart = (newCart: CartItem[]) => {
    setCartItems(newCart);
    localStorage.setItem('camisavetor_cart', JSON.stringify(newCart));
    window.dispatchEvent(new Event('cart-updated'));
  };

  const removeItem = (id: string) => {
    const newCart = cartItems.filter(item => item.id !== id);
    updateCart(newCart);
  };

  // Como agora vendemos apenas 1 unidade de cada vetor, o subtotal ignora o multiplicador de quantidade manual
  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  return (
    <div className="bg-[#f8f9fa] min-h-screen animate-in fade-in duration-700 font-sans text-[#4a4a4a]">
      <main className="pt-16 md:pt-4 pb-20 px-4">
        <div className="max-w-6xl mx-auto">

          {/* NAVEGAÇÃO E TÍTULO */}
          <div className="mb-10">
            <Link href="/" className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-[#5f6368] hover:text-[#fe7302] transition-colors mb-6 group">
              <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              {t('continueShopping')}
            </Link>

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white rounded-xl border border-[#dadce0] flex items-center justify-center text-[#fe7302] shadow-sm">
                <ShoppingCart size={20} />
              </div>
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-[#202124] uppercase">
                {t('yourCartTitle')} <span className="text-[#fe7302]">{t('yourCartTitleHighlight')}</span>
              </h1>
            </div>
          </div>

          {cartItems.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">

              {/* LISTA DE PRODUTOS */}
              <div className="lg:col-span-8 space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 md:gap-8 p-4 md:p-6 bg-white rounded-[1.5rem] border border-[#dadce0] transition-all hover:shadow-md hover:border-[#fe7302]/30 group">

                    <div className="w-20 h-20 md:w-28 md:h-28 bg-[#f1f3f4] rounded-2xl overflow-hidden flex-shrink-0 relative border border-[#dadce0]">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>

                    <div className="flex-1 flex flex-col justify-center h-full py-1">
                      <div>
                        <h3 className="text-[12px] font-bold text-[#202124] uppercase tracking-wide group-hover:text-[#fe7302] transition-colors line-clamp-1">
                          {tp(item.name)}
                        </h3>
                        <p className="text-[10px] text-[#5f6368] font-medium uppercase tracking-widest">{t('vectorPremium')}</p>
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        <p className="text-[#fe7302] font-bold text-sm md:text-base tracking-tight">
                          {formatPrice(item.price)}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-3 text-[#dadce0] hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                      title="Remover item"
                    >
                      <Trash2 size={18} strokeWidth={1.5} />
                    </button>
                  </div>
                ))}
              </div>

              {/* RESUMO DO PEDIDO */}
              <div className="lg:col-span-4">
                <div className="bg-[#1a1a1a] rounded-[2rem] p-8 md:p-10 text-white sticky top-28 shadow-2xl border border-white/5 overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#fe7302]/10 rounded-full blur-[50px] -mr-16 -mt-16" />

                  {/* TÍTULO CENTRALIZADO */}
                  <h2 className="text-[11px] font-bold uppercase tracking-[0.4em] mb-10 text-white/40 border-b border-white/10 pb-6 text-center">
                    {t('orderSummaryTitle')}
                  </h2>

                  <div className="space-y-5 mb-10 relative z-10">
                    <div className="flex justify-between text-[11px] font-medium uppercase tracking-widest text-white/60">
                      <span>{t('subtotal')}</span>
                      <span className="text-white/90">{formatPrice(subtotal)}</span>
                    </div>
                    <div className="pt-8 mt-4 border-t border-white/10 flex justify-between items-baseline">
                      <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#fe7302]">{t('total')}</span>
                      <div className="text-3xl font-semibold tracking-tighter text-white">
                        {formatPrice(subtotal)}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (user) {
                        router.push('/checkout');
                      } else {
                        router.push('/login?redirect=/checkout');
                      }
                    }}
                    className="group w-full bg-[#fe7302] hover:bg-white text-white hover:text-[#1a1a1a] font-bold py-6 rounded-2xl transition-all duration-500 shadow-xl shadow-orange-900/20 uppercase text-[12px] tracking-[0.2em] flex items-center justify-center gap-3 active:scale-[0.98]"
                  >
                    <span>{t('finishPurchase')}</span>
                    <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                  </button>

                  {/* Informações de pagamento removidas conforme solicitado */}
                </div>
              </div>

            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-32 text-center animate-in zoom-in-95 duration-1000">
              <div className="w-24 h-24 bg-white rounded-[2rem] border border-[#dadce0] flex items-center justify-center mb-8 shadow-sm">
                <ShoppingCart size={32} className="text-[#dadce0] stroke-[1px]" />
              </div>
              <h2 className="text-[14px] font-semibold text-[#202124] uppercase tracking-[0.2em] mb-2">{t('emptyCartTitle')}</h2>
              <p className="text-[11px] text-[#5f6368] font-medium uppercase tracking-[0.1em] mb-10 max-w-[280px] leading-relaxed">
                {t('emptyCartDesc')}
              </p>
              <Link href="/" className="bg-[#202124] text-white px-12 py-5 rounded-2xl font-bold uppercase tracking-[0.2em] text-[10px] hover:bg-[#fe7302] transition-all active:scale-95">
                {t('exploreMore')}
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function CarrinhoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa]">
        <div className="w-10 h-10 border-2 border-[#fe7302] border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <CarrinhoContent />
    </Suspense>
  );
}