/**
 * Lista de erros de cliente transitórios, desconexões de rede e restrições
 * de crawlers (Googlebot) que devem ser ignorados de alertas por e-mail.
 */
export const IGNORED_CLIENT_ERRORS = [
  'network error',
  'failed to fetch',
  'networkerror',
  'load failed',
  'abort error',
  'aborterror',
  'the user aborted a request',
  'securityerror',
  'access is denied for this document',
  'sessionstorage',
  'localstorage',
  'chunkloaderror',
  'loading chunk',
  'failed to fetch dynamically imported module',
  'importing a module script failed',
  'resizeobserver loop limit exceeded',
  'resizeobserver loop completed with undelivered notifications',
  'quotaexceedederror',
];

export function shouldIgnoreError(message?: string | null): boolean {
  if (!message) return false;
  const lowerMsg = message.toLowerCase();
  return IGNORED_CLIENT_ERRORS.some((ignored) => lowerMsg.includes(ignored));
}
