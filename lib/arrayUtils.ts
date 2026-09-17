/**
 * Embaralha um array usando o algoritmo Fisher-Yates (Knuth shuffle).
 * Retorna uma nova cópia embaralhada sem mutar o array original.
 */
export function shuffleArray<T>(array: T[]): T[] {
  if (!array || array.length <= 1) return [...(array || [])];
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
