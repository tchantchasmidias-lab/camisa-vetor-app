/**
 * Lista de erros de cliente transitórios, conexões fechadas, extensões de navegador,
 * traduções automáticas do DOM e restrições de crawlers que devem ser ignorados.
 */
export const IGNORED_CLIENT_ERRORS = [
  // 1. Rede transitória, desconexões e conexões fechadas
  'connection closed',
  'connection reset',
  'connection refused',
  'connection aborted',
  'connection was closed',
  'err_connection_closed',
  'err_connection_reset',
  'err_connection_refused',
  'err_connection_aborted',
  'err_name_not_resolved',
  'err_network_changed',
  'err_internet_disconnected',
  'err_timed_out',
  'network error',
  'networkerror',
  'network request failed',
  'failed to fetch',
  'fetch failed',
  'load failed',
  'client is offline',
  'the client is offline',

  // 2. Abort / Cancelamento de requisições
  'abort error',
  'aborterror',
  'the user aborted a request',
  'operation was aborted',
  'request was aborted',
  'user aborted',
  'signal is aborted',

  // 3. WebSockets & Streams (comum em listeners Firestore/Firebase quando crawler encerra)
  'websocket is closed',
  'websocket closed',
  'websocket connection',
  'websocket error',
  'transport close',
  'transport closed',
  'socket closed',
  'stream closed',

  // 4. Permissões / Sandbox / Storage (bots/crawlers bloqueiam cookies e localStorage)
  'securityerror',
  'access is denied for this document',
  'sessionstorage',
  'localstorage',
  'quotaexceedederror',

  // 5. Chunks pós-deploy e módulos dinâmicos
  'chunkloaderror',
  'loading chunk',
  'failed to fetch dynamically imported module',
  'importing a module script failed',

  // 6. Observer loops
  'resizeobserver loop limit exceeded',
  'resizeobserver loop completed with undelivered notifications',

  // 7. Extensões de Navegador (Chrome, Firefox, Safari, Edge)
  'chrome-extension://',
  'moz-extension://',
  'safari-extension://',
  'chrome-extension:',
  'moz-extension:',
  'safari-extension:',

  // 8. Conflitos de DOM causados por extensões e Google Translate
  "failed to execute 'insertbefore' on 'node'",
  "failed to execute 'removechild' on 'node'",
  "failed to execute 'appendchild' on 'node'",
  "the node before which the new node is to be inserted is not a child of this node",
  "the node to be removed is not a child of this node",
  "notfounderror: failed to execute 'insertbefore'",
  "notfounderror: failed to execute 'removechild'",
  'insertbefore',
  'removechild',

  // 9. Tradutores automáticos (Google Translate / Babel)
  'goog_gt_',
  'goog-te-',
  'translate.google',
  'google-translate',
];

/**
 * Padrões de User-Agent conhecidos para crawlers, indexadores e bots.
 */
export const BOT_USER_AGENTS = [
  'googlebot',
  'google-inspectiontool',
  'google-read-aloud',
  'google',
  'bingbot',
  'bingpreview',
  'lighthouse',
  'chrome-lighthouse',
  'slurp',
  'duckduckbot',
  'baiduspider',
  'yandex',
  'sogou',
  'facebot',
  'facebookexternalhit',
  'ia_archiver',
  'semrushbot',
  'ahrefsbot',
  'pinterestbot',
  'twitterbot',
  'crawler',
  'spider',
  'bytespider',
  'petalbot',
];

/**
 * Verifica se a requisição originou-se de um bot, crawler ou ferramenta de inspeção automatizada.
 */
export function isBotUserAgent(userAgent?: string | null): boolean {
  if (!userAgent) return false;
  const lowerUA = userAgent.toLowerCase();
  return BOT_USER_AGENTS.some((bot) => lowerUA.includes(bot));
}

/**
 * Verifica se uma mensagem ou stack de erro deve ser ignorada para fins de alerta/notificação.
 */
export function shouldIgnoreError(message?: string | null, userAgent?: string | null): boolean {
  if (!message) return false;
  const lowerMsg = message.toLowerCase();

  // 1. Verifica se a mensagem bate com algum dos erros conhecidos da lista
  if (IGNORED_CLIENT_ERRORS.some((ignored) => lowerMsg.includes(ignored.toLowerCase()))) {
    return true;
  }

  // 2. Se a requisição veio de um bot/crawler, mensagens adicionais de rede/timeout/abort são ignoradas
  if (userAgent && isBotUserAgent(userAgent)) {
    const isBotTransient =
      lowerMsg.includes('closed') ||
      lowerMsg.includes('timeout') ||
      lowerMsg.includes('canceled') ||
      lowerMsg.includes('cancelled') ||
      lowerMsg.includes('fetch') ||
      lowerMsg.includes('script error') ||
      lowerMsg.includes('loading') ||
      lowerMsg.includes('reset') ||
      lowerMsg.includes('offline') ||
      lowerMsg.includes('interrupted') ||
      lowerMsg.includes('aborted');
    if (isBotTransient) return true;
  }

  return false;
}
