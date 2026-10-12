/**
 * Modelo híbrido de monetização — tipos e regras compartilhadas (client + server).
 * NÃO importar firebase-admin aqui: este arquivo também é usado em componentes client.
 */

export type SubscriptionPlan = 'free' | 'pro' | 'grafica';
export type PaidPlan = Exclude<SubscriptionPlan, 'free'>;
export type SubscriptionStatus = 'active' | 'paused' | 'canceled';

export interface DownloadHistoryEntry {
  productId: string;
  /** Firestore Timestamp (client ou admin) */
  downloadedAt: unknown;
  method: 'credit' | 'direct_purchase';
}

/** Campos de assinatura no documento users/{userId}. */
export interface SubscriptionFields {
  isSubscriber?: boolean;
  subscriptionPlan?: SubscriptionPlan;
  subscriptionStatus?: SubscriptionStatus;
  subscriptionId?: string;
  /** Firestore Timestamp: próxima renovação / fim do período já pago */
  subscriptionRenewsAt?: unknown;
  monthlyCredits?: number;
  availableCredits?: number;
  downloadHistory?: DownloadHistoryEntry[];
}

export interface PlanConfig {
  id: PaidPlan;
  name: string;
  price: number;
  credits: number;
}

export const PLANS: Record<PaidPlan, PlanConfig> = {
  pro: { id: 'pro', name: 'Clube PRO', price: 39.9, credits: 15 },
  grafica: { id: 'grafica', name: 'Plano Gráfica', price: 79.9, credits: 40 },
};

export const BILLING_CYCLE_DAYS = 30;
/** Tolerância (dias) para atraso do webhook de renovação em assinaturas ativas. */
export const RENEWAL_GRACE_DAYS = 3;

export function isPaidPlan(value: unknown): value is PaidPlan {
  return value === 'pro' || value === 'grafica';
}

export function pricePerArt(plan: PaidPlan): number {
  return PLANS[plan].price / PLANS[plan].credits;
}

export function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/** Converte Timestamp (client/admin), Date, número ou {seconds} em milissegundos. */
export function toMillis(value: unknown): number | null {
  if (!value) return null;
  const v = value as any;
  if (typeof v.toMillis === 'function') return v.toMillis();
  if (v instanceof Date) return v.getTime();
  if (typeof v === 'number') return v;
  if (typeof v.seconds === 'number') return v.seconds * 1000;
  if (typeof v._seconds === 'number') return v._seconds * 1000;
  if (typeof v === 'string') {
    const t = Date.parse(v);
    return Number.isNaN(t) ? null : t;
  }
  return null;
}

/**
 * Indica se a assinatura ainda dá direito a usar créditos agora.
 * - active: precisa estar dentro do ciclo (+ tolerância de webhook)
 * - canceled: mantém acesso somente até a data final já paga
 * - paused: sem acesso
 */
export function hasActiveEntitlement(user: SubscriptionFields | null | undefined, now = Date.now()): boolean {
  if (!user || user.isSubscriber !== true) return false;
  const renewsAt = toMillis(user.subscriptionRenewsAt);
  if (!renewsAt) return false;
  if (user.subscriptionStatus === 'active') {
    return renewsAt + RENEWAL_GRACE_DAYS * 86_400_000 > now;
  }
  if (user.subscriptionStatus === 'canceled') {
    return renewsAt > now;
  }
  return false;
}

export function hasRedeemed(user: SubscriptionFields | null | undefined, productId: string): boolean {
  return (user?.downloadHistory ?? []).some(
    (h) => h.productId === productId && h.method === 'credit'
  );
}
