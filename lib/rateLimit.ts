/**
 * Rate limiter em memória (por instância do servidor) + trava de concorrência por chave.
 * Suficiente para frear scripts simples de scraping; para proteção global entre instâncias
 * use um store compartilhado (ex.: Redis / Firestore).
 */
const hits = new Map<string, number[]>();
const inFlight = new Set<string>();

export function checkRateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= max) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);

  // Limpeza oportunista para não crescer indefinidamente
  if (hits.size > 5000) {
    hits.forEach((v, k) => {
      if (v.every((t) => now - t >= windowMs)) hits.delete(k);
    });
  }
  return true;
}

/** Retorna false se já existe uma requisição em andamento para a chave. */
export function acquireLock(key: string): boolean {
  if (inFlight.has(key)) return false;
  inFlight.add(key);
  return true;
}

export function releaseLock(key: string): void {
  inFlight.delete(key);
}
