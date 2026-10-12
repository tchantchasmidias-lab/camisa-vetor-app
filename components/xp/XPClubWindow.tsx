'use client';

import React, { useState } from 'react';
import { Star, Loader2 } from 'lucide-react';
import { PLANS, formatBRL, pricePerArt, PaidPlan } from '@/lib/subscriptions';
import { startSubscriptionCheckout } from '@/lib/subscriptionClient';

interface XPClubWindowProps {
  onPlayClick?: () => void;
  onPlayNotify?: () => void;
}

/** Janela estilo Windows XP com os planos do Clube de Assinantes. */
export default function XPClubWindow({ onPlayClick, onPlayNotify }: XPClubWindowProps) {
  const [loading, setLoading] = useState<PaidPlan | null>(null);
  const [error, setError] = useState('');

  const subscribe = async (plan: PaidPlan) => {
    onPlayClick?.();
    setError('');
    setLoading(plan);
    try {
      await startSubscriptionCheckout(plan);
    } catch (e: any) {
      onPlayNotify?.();
      setError(e?.message || 'Erro ao iniciar assinatura.');
      setLoading(null);
    }
  };

  return (
    <div className="flex h-full flex-col bg-[#ece9d8] text-[12px] text-black">
      <div className="flex items-center gap-3 border-b border-[#aca899] bg-gradient-to-r from-[#0a246a] to-[#3a6ea5] px-4 py-3 text-white">
        <Star size={30} className="fill-[#ffd23f] text-[#ffd23f] drop-shadow" />
        <div>
          <div className="text-[15px] font-bold">Clube de Assinantes VIP</div>
          <div className="text-[11px] opacity-90">Baixe vetores todo mês com créditos de download</div>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-auto p-3">
        <div className="border border-[#aca899] bg-white p-2 text-[11px]">
          <strong>Compra avulsa:</strong> R$ 12 a R$ 15 por arte (download vitalício individual).
        </div>

        {(Object.values(PLANS)).map((plan) => (
          <fieldset key={plan.id} className="border border-[#aca899] bg-[#f5f4ea] p-3">
            <legend className="px-1 font-bold text-[#0a246a]">{plan.name}</legend>
            <div className="text-[18px] font-bold">
              {formatBRL(plan.price)}<span className="text-[12px] font-normal">/mês</span>
            </div>
            <div className="mb-2">
              {plan.credits} downloads de vetores/mês (~{formatBRL(pricePerArt(plan.id))}/arte) · .CDR e .PDF
            </div>
            <button
              onClick={() => subscribe(plan.id)}
              disabled={loading !== null}
              className="min-w-[120px] rounded-[3px] border border-[#003c74] bg-gradient-to-b from-[#fff] to-[#d6d0c0] px-4 py-1.5 font-semibold active:from-[#d6d0c0] active:to-[#fff] disabled:cursor-wait disabled:opacity-60"
            >
              {loading === plan.id ? (
                <span className="inline-flex items-center gap-1"><Loader2 size={12} className="animate-spin" />Aguarde...</span>
              ) : (
                'Assinar agora'
              )}
            </button>
          </fieldset>
        ))}

        {error && <p role="alert" className="font-bold text-red-700">{error}</p>}

        <p className="text-[11px] text-[#444]">
          Renovação mensal automática. Cancele quando quiser, sem multa.{' '}
          <a href="/planos" className="text-[#0000ee] underline">Ver detalhes e perguntas frequentes</a>
        </p>
      </div>
    </div>
  );
}
