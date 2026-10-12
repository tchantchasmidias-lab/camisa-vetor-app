import { auth } from '@/lib/firebase';
import type { PaidPlan } from '@/lib/subscriptions';

/**
 * Inicia o checkout de assinatura no Mercado Pago.
 * Redireciona para o login se o usuário não estiver autenticado.
 */
export async function startSubscriptionCheckout(plan: PaidPlan): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    window.location.href = `/login?redirect=${encodeURIComponent('/planos')}`;
    return;
  }
  const token = await user.getIdToken();
  const res = await fetch('/api/subscriptions/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ plan }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.initPoint) {
    throw new Error(data.error || 'Não foi possível iniciar a assinatura.');
  }
  window.location.href = data.initPoint;
}
