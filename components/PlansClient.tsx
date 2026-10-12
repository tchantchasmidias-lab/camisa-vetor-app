'use client';

import { useState } from 'react';
import { Check, Loader2, Crown, Download } from 'lucide-react';
import { PLANS, formatBRL, pricePerArt, PaidPlan } from '@/lib/subscriptions';
import { startSubscriptionCheckout } from '@/lib/subscriptionClient';

const BENEFITS = [
  'Arquivos .CDR e .PDF 100% editáveis',
  'Renovação mensal automática dos créditos',
  'Re-download dos vetores já resgatados sem gastar crédito',
  'Cancele quando quiser, sem multa',
];

export default function PlansClient() {
  const [loading, setLoading] = useState<PaidPlan | null>(null);
  const [error, setError] = useState('');

  const subscribe = async (plan: PaidPlan) => {
    setError('');
    setLoading(plan);
    try {
      await startSubscriptionCheckout(plan);
    } catch (e: any) {
      setError(e?.message || 'Erro ao iniciar assinatura.');
      setLoading(null);
    }
  };

  return (
    <div>
      {error && (
        <p role="alert" className="mb-4 text-center text-sm font-semibold text-red-600">
          {error}
        </p>
      )}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Avulso */}
        <div className="flex flex-col rounded-3xl border border-[#dadce0] bg-white p-6 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-widest text-[#475569]">Compra Avulsa</h3>
          <p className="mt-4 text-3xl font-extrabold text-[#0f172a]">R$ 12 a R$ 15</p>
          <p className="text-sm text-[#475569]">por arte</p>
          <ul className="mt-6 flex-1 space-y-3 text-sm text-[#334155]">
            <li className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0 text-[#16a34a]" />Download vitalício individual</li>
            <li className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0 text-[#16a34a]" />Pagamento via Pix ou cartão</li>
            <li className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0 text-[#16a34a]" />Sem mensalidade</li>
          </ul>
          <a
            href="/"
            className="mt-6 flex min-h-[48px] items-center justify-center rounded-2xl border border-[#dadce0] text-xs font-bold uppercase tracking-widest text-[#202124] transition-colors hover:bg-[#f8f9fa]"
          >
            Ver catálogo
          </a>
        </div>

        {/* PRO e Gráfica */}
        {(Object.values(PLANS)).map((plan) => {
          const featured = plan.id === 'pro';
          return (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-3xl p-6 shadow-lg ${
                featured ? 'border-2 border-[#fe7302] bg-[#fff8f2]' : 'border border-[#dadce0] bg-white'
              }`}
            >
              {featured && (
                <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-[#fe7302] px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-white">
                  <Crown size={12} /> Mais popular
                </span>
              )}
              <h3 className="text-sm font-bold uppercase tracking-widest text-[#475569]">{plan.name}</h3>
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
              <button
                onClick={() => subscribe(plan.id)}
                disabled={loading !== null}
                className={`mt-6 flex min-h-[48px] items-center justify-center rounded-2xl text-xs font-bold uppercase tracking-widest text-white transition-colors disabled:cursor-wait disabled:opacity-70 ${
                  featured ? 'bg-[#fe7302] hover:bg-[#202124]' : 'bg-[#202124] hover:bg-[#fe7302]'
                }`}
              >
                {loading === plan.id ? (
                  <><Loader2 size={16} className="mr-2 animate-spin" />Redirecionando...</>
                ) : (
                  `Assinar ${plan.name}`
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
