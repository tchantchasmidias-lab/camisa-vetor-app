'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Trash2, ShoppingCart, ArrowRight, ChevronLeft, Tag, CheckCircle2, AlertCircle, Loader2, X } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useGeo } from '@/lib/i18n/GeoContext';
import { formatTitleCase } from '@/lib/stringUtils';
import { safeLocalStorage, safeSessionStorage } from '@/lib/safeStorage';

interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

interface CouponData {
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  discount: number;
  finalTotal: number;
}

function CarrinhoContent() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  // Estados do cupom
  const [couponInput, setCouponInput] = useState('');
  const [couponData, setCouponData] = useState<CouponData | null>(null);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  const { t, tp, formatPrice, isLoading: loadingGeo } = useGeo();

  useEffect(() => {
    const rawCart = safeLocalStorage.getItem('camisavetor_cart');
    try {
      setCartItems(rawCart ? JSON.parse(rawCart) : []);
    } catch {
      setCartItems([]);
    }

    // Restaurar cupom salvo (se voltou do checkout)
    const savedCoupon = safeSessionStorage.getItem('camisavetor_coupon');
    if (savedCoupon) {
      try { setCouponData(JSON.parse(savedCoupon)); } catch {}
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  const updateCart = (newCart: CartItem[]) => {
    setCartItems(newCart);
    safeLocalStorage.setItem('camisavetor_cart', JSON.stringify(newCart));
    window.dispatchEvent(new Event('cart-updated'));
  };

  const removeItem = (id: string) => {
    const newCart = cartItems.filter(item => item.id !== id);
    updateCart(newCart);
    // Se removeu item e total mudou, limpa o cupom para revalidar
    setCouponData(null);
    setCouponError('');
    safeSessionStorage.removeItem('camisavetor_coupon');
  };

  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const discount = couponData?.discount ?? 0;
  const total = couponData?.finalTotal ?? subtotal;

  const handleApplyCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    setCouponLoading(true);
    setCouponError('');
    setCouponData(null);
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, cartTotal: subtotal }),
      });
      const data = await res.json();
      if (data.valid) {
        const coupon: CouponData = {
          code,
          type: data.coupon.type,
          value: data.coupon.value,
          discount: data.discount,
          finalTotal: data.finalTotal,
        };
        setCouponData(coupon);
        safeSessionStorage.setItem('camisavetor_coupon', JSON.stringify(coupon));
      } else {
        setCouponError(data.error || 'Cupom inválido.');
      }
    } catch {
      setCouponError('Erro ao verificar o cupom. Tente novamente.');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponData(null);
    setCouponInput('');
    setCouponError('');
    safeSessionStorage.removeItem('camisavetor_coupon');
  };

  return (
    <div className="bg-[#f8f9fa] min-h-screen animate-in fade-in duration-700 font-sans text-[#4a4a4a]">
      <main className="pt-[28px] md:pt-4 pb-20 px-4">
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
                        <h3 className="text-[13px] font-semibold text-[#202124] product-title tracking-normal group-hover:text-[#fe7302] transition-colors line-clamp-1">
                          {formatTitleCase(tp(item.name))}
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

                  <h2 className="text-[11px] font-bold uppercase tracking-[0.4em] mb-8 text-white/40 border-b border-white/10 pb-6 text-center">
                    {t('orderSummaryTitle')}
                  </h2>

                  {/* CAMPO DE CUPOM */}
                  <div className="mb-8 relative z-10">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-white/30 flex items-center gap-2 mb-3">
                      <Tag size={11} /> Cupom de Desconto
                    </p>

                    {couponData ? (
                      /* Cupom aplicado com sucesso */
                      <div className="flex items-center justify-between bg-green-500/10 border border-green-500/30 rounded-2xl px-4 py-3 animate-in fade-in duration-300">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={14} className="text-green-400 flex-shrink-0" />
                          <div>
                            <p className="text-[11px] font-black text-green-400 uppercase tracking-wider">{couponData.code}</p>
                            <p className="text-[9px] text-green-400/70 uppercase">
                              {couponData.type === 'percent' ? `${couponData.value}% de desconto` : `R$ ${couponData.value.toFixed(2).replace('.', ',')} de desconto`}
                            </p>
                          </div>
                        </div>
                        <button onClick={handleRemoveCoupon} className="text-white/30 hover:text-red-400 transition-colors p-1">
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      /* Input para digitar o cupom */
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={couponInput}
                            onChange={e => { setCouponInput(e.target.value.toUpperCase()); setCouponError(''); }}
                            onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()}
                            placeholder="DIGITE SEU CUPOM"
                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-[11px] font-black text-white uppercase outline-none focus:border-[#fe7302]/50 transition-all placeholder-white/20 tracking-widest"
                          />
                          <button
                            onClick={handleApplyCoupon}
                            disabled={couponLoading || !couponInput.trim()}
                            className="bg-[#fe7302] text-white text-[10px] font-black uppercase px-4 py-2.5 rounded-xl hover:bg-orange-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 tracking-widest"
                          >
                            {couponLoading ? <Loader2 size={13} className="animate-spin" /> : 'OK'}
                          </button>
                        </div>
                        {couponError && (
                          <p className="text-[10px] text-red-400 flex items-center gap-1.5 animate-in fade-in duration-200 px-1">
                            <AlertCircle size={11} /> {couponError}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* VALORES */}
                  <div className="space-y-4 mb-10 relative z-10">
                    <div className="flex justify-between text-[11px] font-medium uppercase tracking-widest text-white/60">
                      <span>{t('subtotal')}</span>
                      <span className="text-white/90">{formatPrice(subtotal)}</span>
                    </div>

                    {couponData && (
                      <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest text-green-400 animate-in fade-in duration-300">
                        <span className="flex items-center gap-1.5"><Tag size={11} /> Cupom {couponData.code}</span>
                        <span>- {formatPrice(discount)}</span>
                      </div>
                    )}

                    <div className="pt-6 mt-2 border-t border-white/10 flex justify-between items-baseline">
                      <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#fe7302]">{t('total')}</span>
                      <div className="text-3xl font-semibold tracking-tighter text-white">
                        {formatPrice(total)}
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