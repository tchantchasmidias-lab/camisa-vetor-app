'use client';

import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { PLANS, formatBRL, pricePerArt, type PaidPlan } from '@/lib/subscriptions';
import SubscriptionCheckoutModal from '@/components/SubscriptionCheckoutModal';

interface XPClubWindowProps {
  onPlayClick?: () => void;
  onPlayNotify?: () => void;
}

/** Janela estilo Windows XP com os planos do Clube de Assinantes e Checkout Transparente integrado. */
export default function XPClubWindow({ onPlayClick }: XPClubWindowProps) {
  const [modalPlan, setModalPlan] = useState<PaidPlan | null>(null);

  const subscribe = (plan: PaidPlan) => {
    onPlayClick?.();
    if (!auth.currentUser) {
      window.location.href = `/login?redirect=${encodeURIComponent(`/planos?plan=${plan}&redirect=/xp`)}`;
      return;
    }
    setModalPlan(plan);
  };

  return (
    <div className="flex h-full flex-col bg-[#ece9d8] text-[12px] text-black">
      <div className="flex items-center gap-3 border-b border-[#aca899] bg-gradient-to-r from-[#0a246a] to-[#3a6ea5] px-4 py-3 text-white">
        <Star size={30} className="fill-[#ffd23f] text-[#ffd23f] drop-shadow" />
        <div>
          <div className="text-[15px] font-bold">Clube de Assinantes VIP</div>
          <div className="text-[11px] opacity-90">
            Baixe vetores todo mês com Cartão (Recorrente) ou PIX (Passe 30 Dias)
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-auto p-3">
        <div className="border border-[#aca899] bg-white p-2 text-[11px]">
          <strong>Compra avulsa:</strong> R$ 12 a R$ 15 por arte (download vitalício individual).
        </div>

        {Object.values(PLANS).map((plan) => (
          <fieldset key={plan.id} className="border border-[#aca899] bg-[#f5f4ea] p-3">
            <legend className="px-1 font-bold text-[#0a246a]">{plan.name}</legend>
            <div className="text-[18px] font-bold">
              {formatBRL(plan.price)}
              <span className="text-[12px] font-normal">/mês</span>
            </div>
            <div className="mb-2">
              {plan.credits} downloads de vetores/mês (~{formatBRL(pricePerArt(plan.id))}/arte) · .CDR e .PDF
            </div>
            <button
              type="button"
              onClick={() => subscribe(plan.id)}
              className="min-w-[140px] rounded-[3px] border border-[#003c74] bg-gradient-to-b from-[#fff] to-[#d6d0c0] px-4 py-1.5 font-semibold active:from-[#d6d0c0] active:to-[#fff]"
            >
              Assinar {plan.name}
            </button>
          </fieldset>
        ))}

        <p className="text-[11px] text-[#444]">
          Checkout transparente via Cartão ou Pix (30 dias). Cancele quando quiser, sem multa.{' '}
          <a href="/planos" className="text-[#0000ee] underline">
            Ver detalhes e perguntas frequentes
          </a>
        </p>
      </div>

      <SubscriptionCheckoutModal
        isOpen={modalPlan !== null}
        initialPlan={modalPlan || 'pro'}
        onClose={() => setModalPlan(null)}
        redirectUrl="/xp"
      />
    </div>
  );
}
