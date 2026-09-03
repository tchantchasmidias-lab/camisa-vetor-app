'use client';

import { useState, useEffect, Suspense } from 'react';
import { 
  QrCode, ChevronLeft, Download, CheckCircle2, 
  AlertCircle, Loader2, FileText, Tag, X, User, Phone, Edit2, Check
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useGeo } from '@/lib/i18n/GeoContext';
import { formatCPFMask, formatPhoneMask, isValidCPF, cleanCPF, cleanPhone } from '@/lib/validationUtils';
import { safeLocalStorage, safeSessionStorage } from '@/lib/safeStorage';

interface CouponData {
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  discount: number;
  finalTotal: number;
}

function CheckoutContent() {
  const [paymentMethod, setPaymentMethod] = useState<'pix'>('pix');
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<{nome: string, cpf: string, phone: string, email: string} | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  
  const [isEditingData, setIsEditingData] = useState(false);
  const [editNome, setEditNome] = useState('');
  const [editCpf, setEditCpf] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editError, setEditError] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const [isPaid, setIsPaid] = useState(false);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const router = useRouter();

  const [pixData, setPixData] = useState<{ qr_code_base64: string, qr_code: string, transactionId: string, id: number } | null>(null);
  const [isGeneratingPix, setIsGeneratingPix] = useState(false);
  const [pixError, setPixError] = useState('');
  const [isFulfilling, setIsFulfilling] = useState(false);

  // Estados do cupom
  const [couponInput, setCouponInput] = useState('');
  const [couponData, setCouponData] = useState<CouponData | null>(null);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  
  const { t, tp, formatPrice, isInternational, currencyCode, isLoading: loadingGeo } = useGeo();

  useEffect(() => {
    const rawCart = safeLocalStorage.getItem('camisavetor_cart');
    try {
      setCartItems(rawCart ? JSON.parse(rawCart) : []);
    } catch {
      setCartItems([]);
    }

    // Recuperar cupom aplicado no carrinho
    const savedCoupon = safeSessionStorage.getItem('camisavetor_coupon');
    if (savedCoupon) {
      try { setCouponData(JSON.parse(savedCoupon)); } catch {}
    }
    
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          const userRef = doc(db, 'users', currentUser.uid);
          const snap = await getDoc(userRef);
          
          if (isInternational) {
            const data = {
              nome: snap.data()?.nome || currentUser.displayName || 'Customer',
              cpf: snap.data()?.cpf || '',
              phone: snap.data()?.phone || '',
              email: snap.data()?.email || currentUser.email || ''
            };
            setUserData(data);
            setEditNome(data.nome);
            setEditCpf(formatCPFMask(data.cpf));
            setEditPhone(formatPhoneMask(data.phone));
            setLoadingUser(false);
            setPaymentMethod('pix');
            return;
          }

          if (snap.exists() && snap.data().cpf && snap.data().phone) {
            const data = {
              nome: snap.data().nome || currentUser.displayName || 'Cliente',
              cpf: formatCPFMask(snap.data().cpf),
              phone: formatPhoneMask(snap.data().phone),
              email: snap.data().email || currentUser.email || ''
            };
            setUserData(data);
            setEditNome(data.nome);
            setEditCpf(data.cpf);
            setEditPhone(data.phone);
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

  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const discount = couponData?.discount ?? 0;
  const total = couponData ? couponData.finalTotal : subtotal;

  const handleSaveUserData = async () => {
    setEditError('');
    if (!editNome.trim()) {
      setEditError('Por favor, informe seu nome completo.');
      return;
    }
    if (!isInternational && !isValidCPF(editCpf)) {
      setEditError('CPF inválido. Por favor, verifique os dígitos digitados.');
      return;
    }
    if (!isInternational && cleanPhone(editPhone).length < 10) {
      setEditError('Por favor, informe um WhatsApp válido com DDD.');
      return;
    }

    setSavingEdit(true);
    try {
      if (user?.uid) {
        await setDoc(doc(db, 'users', user.uid), {
          nome: editNome.trim(),
          cpf: formatCPFMask(editCpf),
          phone: formatPhoneMask(editPhone),
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }

      setUserData(prev => prev ? {
        ...prev,
        nome: editNome.trim(),
        cpf: formatCPFMask(editCpf),
        phone: formatPhoneMask(editPhone)
      } : null);

      setIsEditingData(false);
      setPixError('');
    } catch (err) {
      setEditError('Erro ao atualizar dados. Tente novamente.');
    } finally {
      setSavingEdit(false);
    }
  };

  // Registra o uso do cupom após pagamento confirmado
  const registerCouponUse = async () => {
    if (!couponData) return;
    try {
      await fetch('/api/coupons/use', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponData.code }),
      });
      safeSessionStorage.removeItem('camisavetor_coupon');
    } catch (e) {
      console.error('Erro ao registrar uso do cupom:', e);
    }
  };

  const processFulfillment = async (transactionId: string, method: string, providerOrderId?: string) => {
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
          paymentMethod: method,
          providerOrderId
        })
      });
      if (res.ok) {
        await registerCouponUse();
        safeLocalStorage.removeItem('camisavetor_cart');
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

  const handleFinalPayment = async () => {
    if (!userData) return;
    setPixError('');

    if (paymentMethod === 'pix') {
      // Validação de CPF antes de chamar a API
      if (!isInternational && !isValidCPF(userData.cpf)) {
        setPixError('CPF inválido. Por favor, verifique os dígitos digitados.');
        setIsEditingData(true);
        return;
      }

      setIsGeneratingPix(true);
      try {
        const nameParts = (userData.nome || '').trim().split(' ');
        const firstName = nameParts[0] || 'Cliente';
        const lastName = nameParts.slice(1).join(' ') || 'Consumidor';

        const res = await fetch('/api/checkout/pix', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: cartItems,
            userId: user?.uid,
            email: userData.email,
            firstName,
            lastName,
            phone: cleanPhone(userData.phone),
            cpf: cleanCPF(userData.cpf),
            couponCode: couponData ? couponData.code : undefined,
          })
        });

        const data = await res.json();

        if (res.ok && data.qr_code_base64) {
          setPixData(data);
        } else {
          const isCpfErr = 
            data.code === 'INVALID_CPF' || 
            String(data.error || '').toLowerCase().includes('cpf') ||
            String(data.error || '').toLowerCase().includes('identification');

          if (isCpfErr) {
            setPixError('CPF inválido. Por favor, verifique os dígitos digitados.');
            setIsEditingData(true);
          } else {
            setPixError(data.error || t('errorGeneratingPix'));
          }
        }
      } catch (err) {
        console.error(err);
        setPixError('Erro de conexão ao gerar o Pix. Tente novamente em instantes.');
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
          processFulfillment(pixData.transactionId, 'pix', String(pixData.id));
        }
      } catch (error) {
        console.error("Erro ao verificar status do Pix:", error);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [pixData, isPaid]);

  if (!user || loadingUser || loadingGeo) {
    return <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center"><Loader2 className="animate-spin text-[#fe7302]" size={32} /></div>;
  }

  return (
    <div className="bg-[#f8f9fa] min-h-screen font-sans text-[#4a4a4a] animate-in fade-in duration-700">
      <main className="pt-[28px] md:pt-4 pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          
          <Link href="/carrinho" className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#999] hover:text-[#fe7302] transition-colors mb-10 group">
            <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            {t('backToCart')}
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            
            <div className={`lg:col-span-7 space-y-10 transition-all duration-700 ${isPaid ? 'opacity-10 grayscale pointer-events-none' : 'opacity-100'}`}>
              
              {/* 1. FORMA DE PAGAMENTO */}
              <section className="bg-white p-8 rounded-[2rem] border border-[#dadce0]">
                <div className="flex items-center gap-4 mb-8">
                  <span className="w-7 h-7 rounded-full bg-[#202124] text-white flex items-center justify-center text-[10px] font-bold">1</span>
                  <h2 className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#202124]">{t('paymentMethod')}</h2>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div className="p-6 rounded-2xl border-2 border-[#fe7302] bg-orange-50/30 flex items-center gap-4 transition-all">
                    <QrCode size={20} className="text-[#fe7302]" />
                    <div className="text-left">
                      <p className="text-[11px] font-bold text-[#202124] uppercase">PIX</p>
                      <p className="text-[9px] font-medium text-[#5f6368] uppercase">{t('pixInstant')}</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* 2. DADOS DO PAGADOR (CONFIRMAÇÃO / EDIÇÃO) */}
              <section className="bg-white p-8 rounded-[2rem] border border-[#dadce0]">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <span className="w-7 h-7 rounded-full bg-[#202124] text-white flex items-center justify-center text-[10px] font-bold">2</span>
                    <h2 className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#202124] flex items-center gap-2">
                      <User size={14} className="text-[#fe7302]" /> Dados do Comprador
                    </h2>
                  </div>
                  {!isEditingData ? (
                    <button 
                      onClick={() => setIsEditingData(true)} 
                      className="text-[10px] font-bold uppercase tracking-wider text-[#fe7302] hover:text-black flex items-center gap-1.5 transition-colors"
                    >
                      <Edit2 size={12} /> Editar
                    </button>
                  ) : (
                    <button 
                      onClick={() => {
                        setIsEditingData(false);
                        setEditNome(userData?.nome || '');
                        setEditCpf(userData?.cpf || '');
                        setEditPhone(userData?.phone || '');
                        setEditError('');
                      }} 
                      className="text-[10px] font-bold uppercase tracking-wider text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      Cancelar
                    </button>
                  )}
                </div>

                {!isEditingData ? (
                  <div className="bg-[#f8f9fa] rounded-2xl p-5 border border-[#f1f3f4] space-y-2 text-[12px]">
                    <div className="flex justify-between items-center py-1 border-b border-gray-100">
                      <span className="text-gray-400 font-medium">Nome:</span>
                      <span className="font-bold text-[#202124]">{userData?.nome}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-gray-100">
                      <span className="text-gray-400 font-medium">E-mail:</span>
                      <span className="font-bold text-[#202124]">{userData?.email}</span>
                    </div>
                    {!isInternational && (
                      <>
                        <div className="flex justify-between items-center py-1 border-b border-gray-100">
                          <span className="text-gray-400 font-medium">CPF (Pix):</span>
                          <span className="font-bold text-[#202124] font-mono">{userData?.cpf || 'Não informado'}</span>
                        </div>
                        <div className="flex justify-between items-center py-1">
                          <span className="text-gray-400 font-medium">WhatsApp:</span>
                          <span className="font-bold text-[#202124]">{userData?.phone || 'Não informado'}</span>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Nome Completo</label>
                      <input 
                        type="text"
                        value={editNome}
                        onChange={(e) => setEditNome(e.target.value)}
                        className="w-full bg-[#f8f9fa] border border-[#dadce0] rounded-xl px-4 py-3 text-[12px] font-semibold text-[#202124] outline-none focus:border-[#fe7302]"
                        placeholder="Nome completo"
                      />
                    </div>
                    {!isInternational && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">CPF (Somente Números)</label>
                          <input 
                            type="text"
                            value={editCpf}
                            onChange={(e) => setEditCpf(formatCPFMask(e.target.value))}
                            className="w-full bg-[#f8f9fa] border border-[#dadce0] rounded-xl px-4 py-3 text-[12px] font-semibold text-[#202124] outline-none focus:border-[#fe7302]"
                            placeholder="000.000.000-00"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">WhatsApp com DDD</label>
                          <input 
                            type="text"
                            value={editPhone}
                            onChange={(e) => setEditPhone(formatPhoneMask(e.target.value))}
                            className="w-full bg-[#f8f9fa] border border-[#dadce0] rounded-xl px-4 py-3 text-[12px] font-semibold text-[#202124] outline-none focus:border-[#fe7302]"
                            placeholder="(00) 00000-0000"
                          />
                        </div>
                      </div>
                    )}
                    {editError && (
                      <p className="text-[11px] text-red-500 font-bold flex items-center gap-1.5 animate-in fade-in duration-200">
                        <AlertCircle size={13} className="flex-shrink-0" /> {editError}
                      </p>
                    )}
                    <button
                      onClick={handleSaveUserData}
                      disabled={savingEdit}
                      className="bg-[#202124] text-white text-[10px] font-bold uppercase px-6 py-3 rounded-xl hover:bg-[#fe7302] transition-all flex items-center gap-2 tracking-wider"
                    >
                      {savingEdit ? <Loader2 size={13} className="animate-spin" /> : <><Check size={13} /> Salvar Dados</>}
                    </button>
                  </div>
                )}
              </section>

              {/* 3. CAMPO DE CUPOM NO CHECKOUT */}
              <section className="bg-white p-8 rounded-[2rem] border border-[#dadce0]">
                <div className="flex items-center gap-4 mb-6">
                  <span className="w-7 h-7 rounded-full bg-[#202124] text-white flex items-center justify-center text-[10px] font-bold">3</span>
                  <h2 className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#202124] flex items-center gap-2">
                    <Tag size={14} className="text-[#fe7302]" /> Cupom de Desconto
                  </h2>
                </div>

                {couponData ? (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-2xl px-5 py-4 animate-in fade-in duration-300">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 size={18} className="text-green-500 flex-shrink-0" />
                      <div>
                        <p className="text-[12px] font-black text-green-700 uppercase tracking-wider">{couponData.code}</p>
                        <p className="text-[10px] text-green-600 uppercase font-medium">
                          {couponData.type === 'percent' ? `${couponData.value}% de desconto aplicado` : `R$ ${couponData.value.toFixed(2).replace('.', ',')} de desconto aplicado`}
                        </p>
                      </div>
                    </div>
                    <button onClick={handleRemoveCoupon} className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-lg hover:bg-red-50">
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex gap-2 overflow-hidden">
                      <input
                        type="text"
                        value={couponInput}
                        onChange={e => { setCouponInput(e.target.value.toUpperCase()); setCouponError(''); }}
                        onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()}
                        placeholder="DIGITE SEU CUPOM"
                        className="min-w-0 flex-1 border border-[#dadce0] rounded-xl px-4 py-3 text-[12px] font-black uppercase outline-none focus:border-[#fe7302] transition-all placeholder-[#dadce0] tracking-widest text-[#202124]"
                      />
                      <button
                        onClick={handleApplyCoupon}
                        disabled={couponLoading || !couponInput.trim()}
                        className="flex-shrink-0 bg-[#202124] text-white text-[10px] font-black uppercase px-5 py-3 rounded-xl hover:bg-[#fe7302] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 tracking-widest"
                      >
                        {couponLoading ? <Loader2 size={14} className="animate-spin" /> : 'Aplicar'}
                      </button>
                    </div>
                    {couponError && (
                      <p className="text-[11px] text-red-500 flex items-center gap-1.5 animate-in fade-in duration-200">
                        <AlertCircle size={13} /> {couponError}
                      </p>
                    )}
                  </div>
                )}
              </section>
            </div>

            {/* COLUNA DA DIREITA: RESUMO */}
            <div className="lg:col-span-5">
              <div className={`rounded-[2.5rem] text-white shadow-2xl sticky top-28 border transition-all duration-700 ${isPaid ? 'bg-transparent border-transparent p-0' : 'bg-[#1a1a1a] border-white/5 p-10'}`}>
                {!isPaid ? (
                  <>
                    <h3 className="text-[11px] font-bold uppercase tracking-[0.4em] mb-8 text-white/30 border-b border-white/10 pb-5 text-center">{t('orderSummaryTitle')}</h3>
                    
                    {/* ITENS */}
                    <div className="space-y-4 mb-8 max-h-[280px] overflow-y-auto no-scrollbar pr-2">
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
                    </div>

                    {/* VALORES COM DESCONTO */}
                    <div className="space-y-3 mb-8 border-t border-white/10 pt-6">
                      <div className="flex justify-between text-[11px] font-medium uppercase tracking-widest text-white/50">
                        <span>Subtotal</span>
                        <span>{formatPrice(subtotal)}</span>
                      </div>
                      {couponData && (
                        <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest text-green-400 animate-in fade-in duration-300">
                          <span className="flex items-center gap-1.5"><Tag size={11} /> {couponData.code}</span>
                          <span>- {formatPrice(discount)}</span>
                        </div>
                      )}
                      <div className="pt-4 border-t border-white/10 flex justify-between items-baseline">
                        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40">{t('total')}</span>
                        <div className="text-4xl font-bold tracking-tighter">
                          <span className="text-[#fe7302]">{formatPrice(total)}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* ALERTA DE ERRO VISUAL AMIGÁVEL */}
                    {pixError && (
                      <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-start gap-3 animate-in fade-in duration-300">
                        <AlertCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
                        <div className="text-left">
                          <p className="text-[11px] font-bold text-red-300 uppercase tracking-wider">Atenção</p>
                          <p className="text-[11px] text-red-200 mt-0.5 leading-snug">{pixError}</p>
                        </div>
                      </div>
                    )}

                    {isFulfilling ? (
                      <div className="bg-white p-6 rounded-2xl flex flex-col items-center justify-center text-black">
                        <Loader2 className="animate-spin text-[#fe7302] mb-2" size={32} />
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{t('releasingFiles')}</p>
                      </div>
                    ) : (
                      <>
                        {!pixData && (
                          <button 
                              onClick={handleFinalPayment} 
                              disabled={isGeneratingPix}
                              className={`w-full font-bold py-6 rounded-2xl transition-all shadow-xl uppercase text-[11px] tracking-[0.2em] flex items-center justify-center gap-3 ${!isGeneratingPix ? 'bg-[#fe7302] hover:bg-white hover:text-black' : 'bg-white/10 text-white/20 cursor-not-allowed'}`}
                          >
                              {isGeneratingPix ? <Loader2 className="animate-spin" /> : <><CheckCircle2 size={18}/> {t('generatePix')}</>}
                          </button>
                        )}

                        {pixData && (
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
                      </>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8">
                     <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 size={32} />
                     </div>
                     <h3 className="text-xl font-bold uppercase tracking-wider mb-2">{t('paymentApproved')}</h3>
                     <p className="text-xs text-gray-400 mb-8">{t('downloadFilesDesc')}</p>
                     
                     <Link href="/perfil" className="bg-[#fe7302] text-white px-8 py-4 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all inline-flex items-center gap-2">
                        <Download size={16} /> {t('accessMyDownloads')}
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

export default function Checkout() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f8f9fa]" />}>
      <CheckoutContent />
    </Suspense>
  );
}