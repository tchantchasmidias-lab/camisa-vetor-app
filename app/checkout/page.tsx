'use client';

import { useState, useEffect, Suspense } from 'react';
import { 
  CreditCard, QrCode, ChevronLeft, Download, CheckCircle2, 
  AlertCircle, Loader2, FileText
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { useGeo } from '@/lib/i18n/GeoContext';

export function CheckoutContent() {
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'paypal'>('pix');
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<{nome: string, cpf: string, phone: string, email: string} | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  
  const [isPaid, setIsPaid] = useState(false);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const router = useRouter();

  const [pixData, setPixData] = useState<{ qr_code_base64: string, qr_code: string, transactionId: string, id: number } | null>(null);
  const [isGeneratingPix, setIsGeneratingPix] = useState(false);
  const [isFulfilling, setIsFulfilling] = useState(false);
  
  const { t, tp, formatPrice, isInternational, currencyCode, isLoading: loadingGeo } = useGeo();

  useEffect(() => {
    const savedCart = JSON.parse(localStorage.getItem('camisavetor_cart') || '[]');
    setCartItems(savedCart);
    
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          const userRef = doc(db, 'users', currentUser.uid);
          const snap = await getDoc(userRef);
          
          // Se for internacional, não exigimos CPF/Phone para entrar no checkout
          if (isInternational) {
            setUserData({
              nome: snap.data()?.nome || currentUser.displayName || 'Customer',
              cpf: snap.data()?.cpf || '',
              phone: snap.data()?.phone || '',
              email: snap.data()?.email || currentUser.email || ''
            });
            setLoadingUser(false);
            setPaymentMethod('paypal'); // Força PayPal para internacionais
            return;
          }

          if (snap.exists() && snap.data().cpf && snap.data().phone) {
            setUserData({
              nome: snap.data().nome || currentUser.displayName || 'Cliente',
              cpf: snap.data().cpf,
              phone: snap.data().phone,
              email: snap.data().email || currentUser.email || ''
            });
            setLoadingUser(false);
          } else {
            router.push('/completar-perfil?redirect=/checkout');
          }
        } catch (err) {
          console.error("Erro ao buscar dados do usuário", err);
          if (!isInternational) {
            router.push('/completar-perfil?redirect=/checkout');
          } else {
            setLoadingUser(false);
          }
        }
      } else {
        router.push('/login?redirect=/checkout');
      }
    });

    return () => unsubscribe();
  }, [router, isInternational]);

  const total = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const processFulfillment = async (transactionId: string, method: string) => {
    setIsFulfilling(true);
    try {
      const res = await fetch('/api/fulfillment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.uid,
          email: userData?.email || user?.email,
          items: cartItems,
          transactionId,
          paymentMethod: method
        })
      });
      if (res.ok) {
        localStorage.removeItem('camisavetor_cart');
        window.dispatchEvent(new Event('cart-updated'));
        setIsPaid(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        alert(t('errorReleasingFiles'));
      }
    } catch (err) {
      console.error(err);
      alert(t('connectionErrorFiles'));
    } finally {
      setIsFulfilling(false);
    }
  };

  const handleFinalPayment = async () => {
    if (!userData) return;

    if (paymentMethod === 'pix') {
      setIsGeneratingPix(true);
      try {
        const res = await fetch('/api/checkout/pix', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: cartItems,
            email: userData.email,
            firstName: userData.nome.split(' ')[0],
            cpf: userData.cpf
          })
        });
        const data = await res.json();
        if (data.qr_code_base64) {
          setPixData(data);
        } else {
          alert(t('errorGeneratingPix') + ": " + (data.error || t('unknownError')));
        }
      } catch (err) {
        console.error(err);
        alert(t('connectionErrorMP'));
      } finally {
        setIsGeneratingPix(false);
      }
    }
  };

  useEffect(() => {
    if (!pixData || isPaid) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/checkout/status?id=${pixData.id}`);
        const data = await res.json();
        if (data.status === 'approved') {
          clearInterval(interval);
          processFulfillment(pixData.transactionId, 'pix');
        }
      } catch (error) {
        console.error("Erro ao verificar status do Pix:", error);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [pixData, isPaid]);

  const formattedValue = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(total);

  if (!user || loadingUser || loadingGeo) {
    return <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center"><Loader2 className="animate-spin text-[#fe7302]" size={32} /></div>;
  }

  return (
    <div className="bg-[#f8f9fa] min-h-screen font-sans text-[#4a4a4a] animate-in fade-in duration-700">
      <main className="pt-16 md:pt-4 pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          
          <Link href="/carrinho" className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#999] hover:text-[#fe7302] transition-colors mb-10 group">
            <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            {t('backToCart')}
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            
            <div className={`lg:col-span-7 space-y-10 transition-all duration-700 ${isPaid ? 'opacity-10 grayscale pointer-events-none' : 'opacity-100'}`}>
              
              <section className="bg-white p-8 rounded-[2rem] border border-[#dadce0]">
                <div className="flex items-center gap-4 mb-8">
                  <span className="w-7 h-7 rounded-full bg-[#202124] text-white flex items-center justify-center text-[10px] font-bold">1</span>
                  <h2 className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#202124]">{t('paymentMethod')}</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {!isInternational && (
                    <button onClick={() => setPaymentMethod('pix')} className={`p-6 rounded-2xl border-2 flex items-center gap-4 transition-all ${paymentMethod === 'pix' ? 'border-[#fe7302] bg-orange-50/30' : 'border-[#f1f3f4] bg-[#f8f9fa]'}`}>
                      <QrCode size={20} className={paymentMethod === 'pix' ? 'text-[#fe7302]' : 'text-[#dadce0]'} />
                      <div className="text-left"><p className="text-[11px] font-bold text-[#202124] uppercase">PIX</p><p className="text-[9px] font-medium text-[#5f6368] uppercase">{t('pixInstant')}</p></div>
                    </button>
                  )}
                  <button onClick={() => setPaymentMethod('paypal')} className={`p-6 rounded-2xl border-2 flex items-center gap-4 transition-all ${paymentMethod === 'paypal' ? 'border-blue-500 bg-blue-50/30' : 'border-[#f1f3f4] bg-[#f8f9fa]'} ${isInternational ? 'md:col-span-2' : ''}`}>
                    <CreditCard size={20} className={paymentMethod === 'paypal' ? 'text-blue-500' : 'text-[#dadce0]'} />
                    <div className="text-left"><p className="text-[11px] font-bold text-[#202124] uppercase">PAYPAL</p><p className="text-[9px] font-medium text-[#5f6368] uppercase">{t('creditCard')}</p></div>
                  </button>
                </div>
              </section>
            </div>

            {/* COLUNA DA DIREITA: RESUMO */}
            <div className="lg:col-span-5">
              <div className={`rounded-[2.5rem] text-white shadow-2xl sticky top-28 border transition-all duration-700 ${isPaid ? 'bg-transparent border-transparent p-0' : 'bg-[#1a1a1a] border-white/5 p-10'}`}>
                {!isPaid ? (
                  <>
                    <h3 className="text-[11px] font-bold uppercase tracking-[0.4em] mb-10 text-white/30 border-b border-white/10 pb-5 text-center">{t('orderSummaryTitle')}</h3>
                    <div className="space-y-4 mb-10 max-h-[350px] overflow-y-auto no-scrollbar pr-2">
                      {cartItems.map((item) => (
                        <div key={item.id} className="flex items-center gap-4 bg-white p-3 rounded-2xl shadow-inner">
                          <div className="w-14 h-14 relative rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                             <Image src={item.image} alt={item.name} fill className="object-cover" />
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#202124] truncate">{tp(item.name)}</h4>
                            <p className="text-[11px] font-bold text-[#fe7302] mt-1">{formatPrice(item.price)}</p>
                          </div>
                        </div>
                      ))}

                      <div className="pt-8 mt-6 border-t border-white/10 flex justify-between items-baseline">
                        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40">{t('total')}</span>
                        <div className="text-4xl font-bold tracking-tighter">
                          <span className="text-[#fe7302]">{formatPrice(total)}</span>
                        </div>
                      </div>
                    </div>
                    
                    {isFulfilling ? (
                      <div className="bg-white p-6 rounded-2xl flex flex-col items-center justify-center text-black">
                        <Loader2 className="animate-spin text-[#fe7302] mb-2" size={32} />
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{t('releasingFiles')}</p>
                      </div>
                    ) : (
                      <>
                        {paymentMethod === 'pix' && !pixData && (
                          <button 
                              onClick={handleFinalPayment} 
                              disabled={isGeneratingPix}
                              className={`w-full font-bold py-6 rounded-2xl transition-all shadow-xl uppercase text-[11px] tracking-[0.2em] flex items-center justify-center gap-3 ${!isGeneratingPix ? 'bg-[#fe7302] hover:bg-white hover:text-black' : 'bg-white/10 text-white/20 cursor-not-allowed'}`}
                          >
                              {isGeneratingPix ? <Loader2 className="animate-spin" /> : <><CheckCircle2 size={18}/> {t('generatePix')}</>}
                          </button>
                        )}

                        {paymentMethod === 'pix' && pixData && (
                          <div className="bg-white p-6 rounded-2xl text-center text-black shadow-inner">
                            <p className="text-[12px] font-bold uppercase mb-4 text-[#fe7302]">{t('scanQrCode')}</p>
                            <div className="bg-white p-2 rounded-xl inline-block border border-gray-100">
                               <Image src={`data:image/jpeg;base64,${pixData.qr_code_base64}`} alt="QR Code Pix" width={180} height={180} className="mx-auto" />
                            </div>
                            <div className="mt-6">
                              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-2">{t('pixCopyPaste')}</p>
                              <div className="relative">
                                <input type="text" readOnly value={pixData.qr_code} className="w-full text-[10px] font-mono p-4 bg-[#f8f9fa] rounded-xl text-center border border-gray-200 outline-none pr-10" />
                                <button onClick={() => { navigator.clipboard.writeText(pixData.qr_code); alert(t('copied')); }} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-[#fe7302]">
                                   <FileText size={16} />
                                </button>
                              </div>
                            </div>
                            <p className="text-[10px] mt-6 font-bold text-gray-300 uppercase tracking-widest animate-pulse flex items-center justify-center gap-2">
                               <Loader2 size={12} className="animate-spin" /> {t('waitingPayment')}
                            </p>
                          </div>
                        )}

                        {paymentMethod === 'paypal' && (
                          <div className="bg-white p-6 rounded-2xl">
                              <PayPalScriptProvider options={{ "clientId": process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "sb", currency: currencyCode }}>
                                <PayPalButtons 
                                  style={{ layout: "vertical", color: "blue", shape: "rect", label: "pay" }}
                                  createOrder={async () => {
                                    const res = await fetch("/api/checkout/paypal/create", {
                                      method: "POST",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({ items: cartItems, currency: currencyCode })
                                    });
                                    const order = await res.json();
                                    return order.id;
                                  }}
                                  onApprove={async (data) => {
                                    const res = await fetch("/api/checkout/paypal/capture", {
                                      method: "POST",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({ orderID: data.orderID })
                                    });
                                    const captureData = await res.json();
                                    if (captureData.status === "COMPLETED") {
                                      processFulfillment(data.orderID, 'paypal');
                                    } else {
                                      alert(t('errorPaypalCapture'));
                                    }
                                  }}
                                />
                              </PayPalScriptProvider>
                          </div>
                        )}
                      </>
                    )}

                    <p className="text-[9px] text-white/40 font-medium leading-relaxed mt-8 text-center uppercase tracking-widest">
                      {t('privacyNote')}
                    </p>
                  </>
                ) : (
                  <div className="flex flex-col items-center text-center py-10 px-6 animate-in zoom-in-95 duration-500 bg-[#141414] rounded-[2.5rem] border border-[#1ea362] shadow-[0_0_25px_rgba(30,163,98,0.15)] relative overflow-hidden">
                    
                    {/* ÍCONE CHECK LARANJA COM BRILHOS */}
                    <div className="relative mb-8 flex justify-center items-center">
                       <div className="absolute -top-4 -right-4 text-[#fe7302] animate-pulse">✨</div>
                       <CheckCircle2 size={70} className="text-[#fe7302]" strokeWidth={2.5} />
                    </div>
                    
                    <h2 className="text-2xl md:text-3xl font-medium uppercase tracking-wide mb-6 text-white">
                      {t('paymentApproved')}
                    </h2>
                    
                    <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-gray-300 mb-12 leading-relaxed max-w-[280px]">
                      {t('thankYou')}<br/>
                      <span className="text-white font-bold">{userData?.nome?.split(' ')[0] || t('defaultUser')}</span>!
                    </p>
                    
                    <button onClick={() => router.push('/downloads')} className="group w-full bg-[#56c271] text-white font-bold py-5 rounded-2xl flex items-center justify-center gap-3 shadow-lg hover:bg-[#4ab063] uppercase text-[12px] tracking-[0.2em] transition-all">
                        <Download size={20} className="group-hover:-translate-y-1 transition-transform" /> 
                        {t('goToDownloads')}
                    </button>
                    
                    <div className="mt-10 mb-6 w-full h-[1px] bg-[#fe7302]/50"></div>
                    
                    <Link href="/" className="text-[10px] font-medium uppercase tracking-[0.2em] text-gray-400 hover:text-white transition-all">
                      {t('exploreMore')}
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-white"><div className="w-8 h-8 border-2 border-[#fe7302] border-t-transparent rounded-full animate-spin"></div></div>}>
      <CheckoutContent />
    </Suspense>
  );
}