'use client';

import React, { useEffect, useState } from 'react';
import {
  X,
  CreditCard,
  QrCode,
  CheckCircle2,
  Copy,
  Check,
  Loader2,
  ShieldCheck,
  Sparkles,
  Lock,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import {
  PLANS,
  formatBRL,
  pricePerArt,
  type PaidPlan,
} from '@/lib/subscriptions';
import {
  cleanCPF,
  formatCPFMask,
  formatPhoneMask,
  isValidCPF,
} from '@/lib/validationUtils';

declare global {
  interface Window {
    MercadoPago?: any;
  }
}

interface SubscriptionCheckoutModalProps {
  isOpen: boolean;
  initialPlan: PaidPlan;
  onClose: () => void;
  redirectUrl?: string;
  onSuccess?: (availableCredits: number, plan: PaidPlan) => void;
}

function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
}

function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export default function SubscriptionCheckoutModal({
  isOpen,
  initialPlan,
  onClose,
  redirectUrl = '/',
  onSuccess,
}: SubscriptionCheckoutModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<PaidPlan>(initialPlan);
  const [tab, setTab] = useState<'card' | 'pix'>('card');

  // Dados do usuário
  const [payerName, setPayerName] = useState('');
  const [payerCpf, setPayerCpf] = useState('');
  const [payerPhone, setPayerPhone] = useState('');
  const [payerEmail, setPayerEmail] = useState('');

  // Campos do Cartão
  const [cardNumber, setCardNumber] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // Estados de carregamento / erro / sucesso
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isApproved, setIsApproved] = useState(false);
  const [unlockedCredits, setUnlockedCredits] = useState<number | null>(null);

  // Estados do Pix
  const [pixData, setPixData] = useState<{
    id: number | string;
    transactionId: string;
    qr_code: string;
    qr_code_base64: string;
  } | null>(null);
  const [copiedPix, setCopiedPix] = useState(false);

  useEffect(() => {
    setSelectedPlan(initialPlan);
  }, [initialPlan]);

  // Carrega script oficial do Mercado Pago JS SDK v2 para tokenização no frontend
  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') return;
    if (document.getElementById('mp-sdk-v2')) return;
    const script = document.createElement('script');
    script.id = 'mp-sdk-v2';
    script.src = 'https://sdk.mercadopago.com/js/v2';
    script.async = true;
    document.body.appendChild(script);
  }, [isOpen]);

  // Preenche dados existentes do usuário autenticado
  useEffect(() => {
    if (!isOpen) return;
    setError('');
    setPixData(null);
    setIsApproved(false);

    const user = auth.currentUser;
    if (!user) return;
    setPayerEmail(user.email || '');

    getDoc(doc(db, 'users', user.uid))
      .then((snap) => {
        if (!snap.exists()) return;
        const data = snap.data();
        const nome = data.nome || user.displayName || '';
        setPayerName(nome);
        if (!cardholderName && nome) setCardholderName(nome.toUpperCase());
        if (data.cpf) setPayerCpf(formatCPFMask(String(data.cpf)));
        if (data.phone) setPayerPhone(formatPhoneMask(String(data.phone)));
        if (data.email) setPayerEmail(data.email);
      })
      .catch(() => {});
  }, [isOpen]);

  // Resetar QR code se o usuário trocar de plano enquanto estiver na aba Pix
  const handleSelectPlan = (planId: PaidPlan) => {
    setSelectedPlan(planId);
    setPixData(null);
    setError('');
  };

  // Polling em tempo real + listener Firestore para detectar confirmação do Pix
  useEffect(() => {
    if (!isOpen || !pixData || isApproved) return;
    const user = auth.currentUser;

    let finished = false;
    const markSuccess = (credits: number) => {
      if (finished) return;
      finished = true;
      setUnlockedCredits(credits);
      setIsApproved(true);
      window.dispatchEvent(new Event('subscription-updated'));
      onSuccess?.(credits, selectedPlan);
    };

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/checkout/status?id=${pixData.id}`);
        const data = await res.json();
        if (data.status === 'approved') {
          clearInterval(interval);
          markSuccess(data.availableCredits ?? PLANS[selectedPlan].credits);
        }
      } catch {
        // Ignora falha transitória de rede no polling
      }
    }, 4000);

    let unsubFirestore: (() => void) | undefined;
    if (user) {
      const startedAt = Date.now();
      unsubFirestore = onSnapshot(doc(db, 'users', user.uid), (snap) => {
        const d = snap.data();
        if (
          d?.isSubscriber === true &&
          d?.subscriptionId === `pix_${pixData.id}` &&
          Date.now() >= startedAt
        ) {
          clearInterval(interval);
          markSuccess(Number(d.availableCredits) || PLANS[selectedPlan].credits);
        }
      });
    }

    return () => {
      clearInterval(interval);
      unsubFirestore?.();
    };
  }, [isOpen, pixData, isApproved, selectedPlan, onSuccess]);

  // Redirecionamento automático após aprovação
  useEffect(() => {
    if (!isApproved) return;
    const timer = setTimeout(() => {
      window.location.href = redirectUrl || '/';
    }, 2800);
    return () => clearTimeout(timer);
  }, [isApproved, redirectUrl]);

  if (!isOpen) return null;

  const plan = PLANS[selectedPlan];

  const handleCardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const user = auth.currentUser;
    if (!user) {
      window.location.href = `/login?redirect=${encodeURIComponent(`/planos?plan=${selectedPlan}`)}`;
      return;
    }

    const digitsNumber = cardNumber.replace(/\D/g, '');
    if (digitsNumber.length < 13 || digitsNumber.length > 19) {
      setError('Informe um número de cartão válido.');
      return;
    }

    if (cardholderName.trim().length < 3) {
      setError('Informe o nome impresso no cartão.');
      return;
    }

    const [expMonthStr, expYearStr] = cardExpiry.split('/');
    const expMonth = Number(expMonthStr);
    const expYear = Number(expYearStr);
    if (!expMonth || expMonth < 1 || expMonth > 12 || !expYearStr || expYearStr.length < 2) {
      setError('Informe a validade do cartão no formato MM/AA.');
      return;
    }

    const cleanCvv = cardCvv.replace(/\D/g, '');
    if (cleanCvv.length < 3 || cleanCvv.length > 4) {
      setError('Informe o código de segurança (CVV) de 3 ou 4 dígitos.');
      return;
    }

    const cpfDigits = cleanCPF(payerCpf);
    if (!isValidCPF(cpfDigits)) {
      setError('CPF inválido. Verifique os dígitos informados.');
      return;
    }

    setIsSubmitting(true);
    try {
      let clientCardTokenId: string | undefined;
      const publicKey = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY;
      if (publicKey && typeof window !== 'undefined' && window.MercadoPago) {
        try {
          const mp = new window.MercadoPago(publicKey, { locale: 'pt-BR' });
          const tokenRes = await mp.createCardToken({
            cardNumber: digitsNumber,
            cardholderName: cardholderName.trim(),
            cardExpirationMonth: String(expMonth).padStart(2, '0'),
            cardExpirationYear: expYear < 100 ? String(2000 + expYear) : String(expYear),
            securityCode: cleanCvv,
            identificationType: 'CPF',
            identificationNumber: cpfDigits,
          });
          if (tokenRes?.id) {
            clientCardTokenId = tokenRes.id;
          }
        } catch {
          // O backend fará a tokenização direta com a credencial da aplicação de assinaturas
        }
      }

      const idToken = await user.getIdToken();
      const res = await fetch('/api/subscriptions/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          plan: selectedPlan,
          paymentMethod: 'card',
          card_token_id: clientCardTokenId,
          email: payerEmail || user.email,
          card: {
            cardNumber: digitsNumber,
            cardholderName: cardholderName.trim(),
            expirationMonth: expMonth,
            expirationYear: expYear < 100 ? 2000 + expYear : expYear,
            securityCode: cleanCvv,
            cpf: cpfDigits,
          },
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Não foi possível autorizar a assinatura.');
      }

      const credits = Number(data.availableCredits) || plan.credits;
      setUnlockedCredits(credits);
      setIsApproved(true);
      window.dispatchEvent(new Event('subscription-updated'));
      onSuccess?.(credits, selectedPlan);
    } catch (err: any) {
      setError(err?.message || 'Erro ao processar assinatura. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGeneratePix = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const user = auth.currentUser;
    if (!user) {
      window.location.href = `/login?redirect=${encodeURIComponent(`/planos?plan=${selectedPlan}`)}`;
      return;
    }

    if (payerName.trim().length < 3) {
      setError('Por favor, informe seu nome completo.');
      return;
    }

    const cpfDigits = cleanCPF(payerCpf);
    if (!isValidCPF(cpfDigits)) {
      setError('CPF inválido. Verifique os dígitos informados.');
      return;
    }

    setIsSubmitting(true);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/subscriptions/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          plan: selectedPlan,
          paymentMethod: 'pix',
          name: payerName.trim(),
          cpf: cpfDigits,
          phone: payerPhone,
          email: payerEmail || user.email,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.qr_code_base64) {
        throw new Error(data.error || 'Não foi possível gerar o Pix no momento.');
      }

      setPixData({
        id: data.id,
        transactionId: data.transactionId,
        qr_code: data.qr_code,
        qr_code_base64: data.qr_code_base64,
      });
    } catch (err: any) {
      setError(err?.message || 'Erro ao gerar QR Code Pix. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyPix = async () => {
    if (!pixData?.qr_code) return;
    try {
      await navigator.clipboard.writeText(pixData.qr_code);
      setCopiedPix(true);
      setTimeout(() => setCopiedPix(false), 3000);
    } catch {
      // Fallback
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkout-modal-title"
    >
      <div className="relative w-full max-w-lg rounded-3xl bg-white border border-[#dadce0] shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between border-b border-zinc-800/85 bg-[#0f172a]/95 backdrop-blur-md px-6 py-5 text-white">
          <div>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-orange-500/70">
              <Sparkles size={13} /> Checkout Transparente
            </span>
            <h2 id="checkout-modal-title" className="mt-0.5 text-lg font-extrabold tracking-tight">
              {plan.name} — {formatBRL(plan.price)}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar checkout"
            className="rounded-full p-2 text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 max-h-[82vh] overflow-y-auto">
          {isApproved ? (
            /* ── TELA DE SUCESSO ─────────────────────────────────────────── */
            <div className="py-6 text-center space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-[#16a34a]">
                <CheckCircle2 size={38} />
              </div>
              <h3 className="text-xl font-extrabold text-[#0f172a]">
                Assinatura Ativada com Sucesso!
              </h3>
              <p className="text-sm text-[#475569] max-w-sm mx-auto">
                Seus <strong>{unlockedCredits ?? plan.credits} créditos de download</strong> do{' '}
                <strong>{plan.name}</strong> já estão liberados na sua conta por 30 dias.
              </p>
              <div className="pt-2">
                <a
                  href={redirectUrl || '/'}
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-[#fe7302] px-6 py-3 text-xs font-bold uppercase tracking-widest text-white shadow-lg hover:bg-[#202124] transition-colors"
                >
                  Começar a baixar vetores <ArrowRight size={16} />
                </a>
              </div>
              <p className="text-[11px] text-slate-400">Redirecionando automaticamente...</p>
            </div>
          ) : (
            <>
              {/* Seletor rápido de plano */}
              <div className="mb-5 grid grid-cols-2 gap-2.5 rounded-2xl bg-[#f8f9fa] p-1.5 border border-[#e2e8f0]">
                {Object.values(PLANS).map((p) => {
                  const active = p.id === selectedPlan;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectPlan(p.id)}
                      className={`rounded-xl px-3 py-2.5 text-left transition-all ${
                        active
                          ? 'bg-white border border-[#fe7302] shadow-sm'
                          : 'hover:bg-white/60 border border-transparent opacity-75'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#0f172a]">
                          {p.name}
                        </span>
                        <span className="text-xs font-extrabold text-[#fe7302]">
                          {formatBRL(p.price)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-[#475569]">
                        {p.credits} downloads/mês (~{formatBRL(pricePerArt(p.id))}/arte)
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* Abas de Método de Pagamento */}
              <div className="mb-5 grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setTab('card');
                    setError('');
                  }}
                  className={`flex items-center justify-center gap-2 rounded-2xl border py-3.5 px-3 text-xs font-bold uppercase tracking-wider transition-all ${
                    tab === 'card'
                      ? 'border-2 border-[#fe7302] bg-[#fff8f2] text-[#0f172a] shadow-sm'
                      : 'border-[#dadce0] bg-white text-[#475569] hover:bg-[#f8f9fa]'
                  }`}
                >
                  <CreditCard size={16} className={tab === 'card' ? 'text-[#fe7302]' : 'text-slate-400'} />
                  <span>Cartão (Mensal)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTab('pix');
                    setError('');
                  }}
                  className={`flex items-center justify-center gap-2 rounded-2xl border py-3.5 px-3 text-xs font-bold uppercase tracking-wider transition-all ${
                    tab === 'pix'
                      ? 'border-2 border-[#fe7302] bg-[#fff8f2] text-[#0f172a] shadow-sm'
                      : 'border-[#dadce0] bg-white text-[#475569] hover:bg-[#f8f9fa]'
                  }`}
                >
                  <QrCode size={16} className={tab === 'pix' ? 'text-[#fe7302]' : 'text-slate-400'} />
                  <span>PIX (30 Dias)</span>
                </button>
              </div>

              {error && (
                <div
                  role="alert"
                  className="mb-4 flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 p-3.5 text-xs font-semibold text-red-700"
                >
                  <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-600" />
                  <span>{error}</span>
                </div>
              )}

              {tab === 'card' ? (
                /* ── ABA 1: CARTÃO DE CRÉDITO (RECORRÊNCIA MENSAL) ─────────── */
                <form onSubmit={handleCardSubmit} className="space-y-4">
                  <div className="rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] p-3 text-xs text-[#475569]">
                    Renovação automática mensal de <strong>{formatBRL(plan.price)}</strong> com{' '}
                    <strong>{plan.credits} downloads/mês</strong>. Cancele quando quiser sem multa.
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#475569] mb-1">
                      Número do Cartão
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="cc-number"
                      placeholder="0000 0000 0000 0000"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                      required
                      className="w-full rounded-xl border border-[#dadce0] bg-[#f8f9fa] px-4 py-3 text-sm font-mono font-semibold text-[#0f172a] outline-none focus:border-[#fe7302] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#475569] mb-1">
                      Nome Impresso no Cartão
                    </label>
                    <input
                      type="text"
                      autoComplete="cc-name"
                      placeholder="COMO ESTÁ NO CARTÃO"
                      value={cardholderName}
                      onChange={(e) => setCardholderName(e.target.value.toUpperCase())}
                      required
                      className="w-full rounded-xl border border-[#dadce0] bg-[#f8f9fa] px-4 py-3 text-sm font-semibold text-[#0f172a] uppercase outline-none focus:border-[#fe7302] focus:bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#475569] mb-1">
                        Validade (MM/AA)
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        autoComplete="cc-exp"
                        placeholder="MM/AA"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                        required
                        className="w-full rounded-xl border border-[#dadce0] bg-[#f8f9fa] px-4 py-3 text-sm font-mono font-semibold text-[#0f172a] outline-none focus:border-[#fe7302] focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#475569] mb-1">
                        CVV
                      </label>
                      <input
                        type="password"
                        inputMode="numeric"
                        autoComplete="cc-csc"
                        placeholder="123"
                        maxLength={4}
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        required
                        className="w-full rounded-xl border border-[#dadce0] bg-[#f8f9fa] px-4 py-3 text-sm font-mono font-semibold text-[#0f172a] outline-none focus:border-[#fe7302] focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#475569] mb-1">
                      CPF do Titular
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="000.000.000-00"
                      value={payerCpf}
                      onChange={(e) => setPayerCpf(formatCPFMask(e.target.value))}
                      required
                      className="w-full rounded-xl border border-[#dadce0] bg-[#f8f9fa] px-4 py-3 text-sm font-mono font-semibold text-[#0f172a] outline-none focus:border-[#fe7302] focus:bg-white"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full min-h-[50px] rounded-2xl bg-[#fe7302] py-4 text-xs font-bold uppercase tracking-[0.18em] text-white shadow-lg hover:bg-[#202124] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-wait"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Autorizando Assinatura...
                      </>
                    ) : (
                      <>
                        <Lock size={15} />
                        Assinar {plan.name} ({formatBRL(plan.price)}/mês)
                      </>
                    )}
                  </button>
                </form>
              ) : (
                /* ── ABA 2: PIX (PASSE DE 30 DIAS) ─────────────────────────── */
                <div className="space-y-4">
                  <div className="rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] p-3 text-xs text-[#475569]">
                    <strong>Passe de 30 Dias via Pix:</strong> pagamento único de{' '}
                    <strong>{formatBRL(plan.price)}</strong> sem precisar cadastrar cartão. Libera{' '}
                    <strong>+{plan.credits} créditos imediatamente</strong> por 30 dias.
                  </div>

                  {!pixData ? (
                    <form onSubmit={handleGeneratePix} className="space-y-4">
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-[#475569] mb-1">
                          Nome Completo
                        </label>
                        <input
                          type="text"
                          placeholder="Seu nome completo"
                          value={payerName}
                          onChange={(e) => setPayerName(e.target.value)}
                          required
                          className="w-full rounded-xl border border-[#dadce0] bg-[#f8f9fa] px-4 py-3 text-sm font-semibold text-[#0f172a] outline-none focus:border-[#fe7302] focus:bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-[#475569] mb-1">
                          CPF (Obrigatório para Pix)
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="000.000.000-00"
                          value={payerCpf}
                          onChange={(e) => setPayerCpf(formatCPFMask(e.target.value))}
                          required
                          className="w-full rounded-xl border border-[#dadce0] bg-[#f8f9fa] px-4 py-3 text-sm font-mono font-semibold text-[#0f172a] outline-none focus:border-[#fe7302] focus:bg-white"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full min-h-[50px] rounded-2xl bg-[#16a34a] py-4 text-xs font-bold uppercase tracking-[0.18em] text-white shadow-lg hover:bg-[#15803d] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-wait"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 size={18} className="animate-spin" />
                            Gerando QR Code Pix...
                          </>
                        ) : (
                          <>
                            <QrCode size={17} />
                            Gerar Pix de {formatBRL(plan.price)} ({plan.credits} créditos)
                          </>
                        )}
                      </button>
                    </form>
                  ) : (
                    <div className="space-y-4 text-center animate-in fade-in duration-300">
                      <div className="mx-auto inline-block rounded-2xl border-2 border-[#fe7302] bg-white p-3 shadow-md">
                        <img
                          src={`data:image/png;base64,${pixData.qr_code_base64}`}
                          alt="QR Code Pix"
                          className="h-48 w-48 object-contain mx-auto"
                        />
                      </div>

                      <div className="space-y-2 text-left">
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-[#475569] text-center">
                          Pix Copia e Cola
                        </label>
                        <div className="rounded-xl border border-[#dadce0] bg-[#f8f9fa] p-2.5 font-mono text-[11px] text-[#334155] break-all select-all max-h-20 overflow-y-auto">
                          {pixData.qr_code}
                        </div>
                        <button
                          type="button"
                          onClick={handleCopyPix}
                          className={`w-full min-h-[46px] rounded-2xl py-3 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                            copiedPix
                              ? 'bg-[#16a34a] text-white'
                              : 'bg-[#0f172a] text-white hover:bg-[#fe7302]'
                          }`}
                        >
                          {copiedPix ? (
                            <>
                              <Check size={16} /> Código Pix Copiado!
                            </>
                          ) : (
                            <>
                              <Copy size={16} /> Copiar Código Pix
                            </>
                          )}
                        </button>
                      </div>

                      <div className="flex items-center justify-center gap-2 pt-1 text-xs font-semibold text-[#fe7302]">
                        <Loader2 size={15} className="animate-spin" />
                        <span>Aguardando pagamento... Liberação automática em segundos</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Rodapé de segurança */}
              <div className="mt-5 flex items-center justify-center gap-2 border-t border-[#f1f3f4] pt-4 text-[11px] text-[#64748b]">
                <ShieldCheck size={15} className="text-[#16a34a] shrink-0" />
                <span>Processado com segurança pelo Mercado Pago · Ambiente criptografado</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
