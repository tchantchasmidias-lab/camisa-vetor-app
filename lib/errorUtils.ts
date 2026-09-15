/**
 * Lista de erros de cliente transitórios, extensões de navegador, traduções
 * automáticas do DOM e restrições de crawlers que devem ser ignorados.
 */
export const IGNORED_CLIENT_ERRORS = [
  // Rede transitória & Abort
  'network error',
  'failed to fetch',
  'networkerror',
  'load failed',
  'abort error',
  'aborterror',
  'the user aborted a request',

  // Permissões / Sandbox / Storage
  'securityerror',
  'access is denied for this document',
  'sessionstorage',
  'localstorage',
  'quotaexceedederror',

  // Chunks pós-deploy e módulos dinâmicos
  'chunkloaderror',
  'loading chunk',
  'failed to fetch dynamically imported module',
  'importing a module script failed',

  // Observer loops
  'resizeobserver loop limit exceeded',
  'resizeobserver loop completed with undelivered notifications',

  // Extensões de Navegador (Chrome, Firefox, Safari, Edge)
  'chrome-extension://',
  'moz-extension://',
  'safari-extension://',
  'chrome-extension:',
  'moz-extension:',
  'safari-extension:',

  // Conflitos de DOM causados por extensões e Google Translate
  "failed to execute 'insertbefore' on 'node'",
  "failed to execute 'removechild' on 'node'",
  "failed to execute 'appendchild' on 'node'",
  "the node before which the new node is to be inserted is not a child of this node",
  "the node to be removed is not a child of this node",
  "notfounderror: failed to execute 'insertbefore'",
  "notfounderror: failed to execute 'removechild'",
  'insertbefore',
  'removechild',

  // Tradutores automáticos (Google Translate / Babel)
  'goog_gt_',
  'goog-te-',
  'translate.google',
  'google-translate',
];

export function shouldIgnoreError(message?: string | null): boolean {
  if (!message) return false;
  const lowerMsg = message.toLowerCase();
  return IGNORED_CLIENT_ERRORS.some((ignored) => lowerMsg.includes(ignored.toLowerCase()));
}
