'use client';

import { useEffect, useState } from 'react';
import { Check, Crown, Download, CreditCard, QrCode } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { PLANS, formatBRL, isPaidPlan, pricePerArt, type PaidPlan } from '@/lib/subscriptions';
import SubscriptionCheckoutModal from '@/components/SubscriptionCheckoutModal';

const BENEFITS = [
  'Arquivos .CDR e .PDF 100% editáveis',
  'Cartão (Recorrência Mensal) ou PIX (Passe de 30 Dias)',
  'Re-download dos vetores já resgatados sem gastar crédito',
  'Cancele quando quiser, sem multa',
];

export default function PlansClient() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [modalPlan, setModalPlan] = useState<PaidPlan | null>(null);
  const [redirectAfterSuccess, setRedirectAfterSuccess] = useState<string>('/');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  // Se a URL tiver ?plan=pro ou ?plan=grafica (ex.: retorno do login), abre o modal automaticamente
  useEffect(() => {
    if (!authReady || typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const planParam = params.get('plan');
    const redirectParam = params.get('redirect');
    if (redirectParam && redirectParam.startsWith('/')) {
      setRedirectAfterSuccess(redirectParam);
    }
    if (isPaidPlan(planParam) && user) {
      setModalPlan(planParam);
    }
  }, [authReady, user]);

  const handleOpenCheckout = (plan: PaidPlan) => {
    if (!auth.currentUser) {
      const target = `/planos?plan=${plan}${
        redirectAfterSuccess && redirectAfterSuccess !== '/'
          ? `&redirect=${encodeURIComponent(redirectAfterSuccess)}`
          : ''
      }`;
      window.location.href = `/login?redirect=${encodeURIComponent(target)}`;
      return;
    }
    setModalPlan(plan);
  };

  return (
    <div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Avulso */}
        <div className="flex flex-col rounded-3xl border border-[#dadce0] bg-white p-6 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-widest text-[#475569]">Compra Avulsa</h3>
          <p className="mt-4 text-3xl font-extrabold text-[#0f172a]">R$ 12 a R$ 15</p>
          <p className="text-sm text-[#475569]">por arte</p>
          <ul className="mt-6 flex-1 space-y-3 text-sm text-[#334155]">
            <li className="flex gap-2">
              <Check size={16} className="mt-0.5 shrink-0 text-[#16a34a]" />
              Download vitalício individual
            </li>
            <li className="flex gap-2">
              <Check size={16} className="mt-0.5 shrink-0 text-[#16a34a]" />
              Pagamento via Pix ou cartão
            </li>
            <li className="flex gap-2">
              <Check size={16} className="mt-0.5 shrink-0 text-[#16a34a]" />
              Sem mensalidade
            </li>
          </ul>
          <a
            href="/"
            className="mt-6 flex min-h-[48px] items-center justify-center rounded-2xl border border-[#dadce0] text-xs font-bold uppercase tracking-widest text-[#202124] transition-colors hover:bg-[#f8f9fa]"
          >
            Ver catálogo
          </a>
        </div>

        {/* PRO e Gráfica */}
        {Object.values(PLANS).map((plan) => {
          const featured = plan.id === 'pro';
          return (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-3xl p-6 shadow-lg ${
                featured
                  ? 'border-2 border-[#fe7302] bg-[#fff8f2]'
                  : 'border border-[#dadce0] bg-white'
              }`}
            >
              {featured && (
                <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-[#fe7302] px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-white">
                  <Crown size={12} /> Mais popular
                </span>
              )}
              <h3 className="text-sm font-bold uppercase tracking-widest text-[#475569]">
                {plan.name}
              </h3>
              <p className="mt-4 text-3xl font-extrabold text-[#0f172a]">
                {formatBRL(plan.price)}
                <span className="text-base font-semibold text-[#475569]">/mês</span>
              </p>
              <p className="text-sm font-semibold text-[#fe7302]">
                {plan.credits} downloads/mês — ~{formatBRL(pricePerArt(plan.id))}/arte
              </p>
              <ul className="mt-6 flex-1 space-y-3 text-sm text-[#334155]">
                <li className="flex gap-2">
                  <Download size={16} className="mt-0.5 shrink-0 text-[#fe7302]" />
                  <strong>{plan.credits} downloads de vetores por mês</strong>
                </li>
                {BENEFITS.map((b) => (
                  <li key={b} className="flex gap-2">
                    <Check size={16} className="mt-0.5 shrink-0 text-[#16a34a]" />
                    {b}
                  </li>
                ))}
              </ul>

              <div className="mt-4 flex items-center justify-center gap-3 text-[11px] font-semibold text-[#64748b]">
                <span className="inline-flex items-center gap-1">
                  <CreditCard size={13} className="text-[#fe7302]" /> Cartão Recorrente
                </span>
                <span>•</span>
                <span className="inline-flex items-center gap-1">
                  <QrCode size={13} className="text-[#16a34a]" /> PIX (Passe 30 Dias)
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleOpenCheckout(plan.id)}
                className={`mt-3 flex min-h-[48px] items-center justify-center rounded-2xl text-xs font-bold uppercase tracking-widest text-white transition-colors ${
                  featured ? 'bg-[#fe7302] hover:bg-[#202124]' : 'bg-[#202124] hover:bg-[#fe7302]'
                }`}
              >
                Assinar {plan.name}
              </button>
            </div>
          );
        })}
      </div>

      <SubscriptionCheckoutModal
        isOpen={modalPlan !== null}
        initialPlan={modalPlan || 'pro'}
        onClose={() => setModalPlan(null)}
        redirectUrl={redirectAfterSuccess}
      />
    </div>
  );
}
