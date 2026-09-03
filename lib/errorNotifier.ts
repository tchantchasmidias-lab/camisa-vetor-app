import { Resend } from 'resend';
import { adminDb } from './firebaseAdmin';
import { shouldIgnoreError, IGNORED_CLIENT_ERRORS } from './errorUtils';

export { shouldIgnoreError, IGNORED_CLIENT_ERRORS };

const ADMIN_EMAIL = 'camisavetor@gmail.com';
const SENDER_EMAIL = 'Camisa Vetor <contato@camisavetor.com>';

export interface CriticalErrorAlert {
  subject?: string;
  context: string; // Ex: 'Checkout / Geração de Pix', 'Webhook Mercado Pago', 'PayPal Capture', etc.
  errorMessage: string;
  stack?: string;
  error?: any;
  req?: Request | any;
  requestData?: any;
  orderData?: any;
  userId?: string;
  userEmail?: string;
  level?: 'CRÍTICO' | 'ALERTA' | 'INFO';
}

/**
 * Envia um alerta de e-mail imediato para o administrador quando uma falha crítica ocorre,
 * registrando também o evento na coleção 'error_logs' do Firestore.
 */
export async function sendCriticalErrorAlert(params: CriticalErrorAlert): Promise<void> {
  const {
    subject,
    context,
    errorMessage,
    stack,
    error,
    req,
    requestData,
    orderData,
    userId,
    userEmail,
    level = 'CRÍTICO',
  } = params;

  const now = new Date();
  const timestampIso = now.toISOString();
  const timestampBrt = now.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

  // Extrai informações da requisição
  let clientIp = 'Desconhecido';
  let userAgent = 'Desconhecido';
  let requestUrl = '';
  let requestMethod = '';

  if (req) {
    try {
      if (typeof req.headers?.get === 'function') {
        clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'Desconhecido';
        userAgent = req.headers.get('user-agent') || 'Desconhecido';
        requestUrl = req.url || '';
        requestMethod = req.method || '';
      } else if (req.headers) {
        clientIp = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'Desconhecido';
        userAgent = req.headers['user-agent'] || 'Desconhecido';
      }
    } catch {
      // Ignora erro de extração de cabeçalho
    }
  }

  // Prepara dados consolidados do erro
  const fullErrorMessage = errorMessage || error?.message || 'Erro desconhecido';
  const fullStack = stack || error?.stack || 'Nenhum stack trace disponível';
  const finalSubject = subject || `🚨 [${level}] ${context} - Camisa Vetor`;

  // Ignora erros normais de rede transitórios, desconexões de crawlers/Googlebot, transição de chunks pós-deploy e SecurityError
  if (shouldIgnoreError(fullErrorMessage) || shouldIgnoreError(fullStack)) {
    console.log(`[ErrorNotifier] Erro transitório/cliente ignorado de notificações: ${fullErrorMessage}`);
    return;
  }

  const payloadConsolidado = {
    ...((requestData && typeof requestData === 'object') ? requestData : {}),
    ...((orderData && typeof orderData === 'object') ? orderData : {}),
  };

  const customerEmail = userEmail || payloadConsolidado.email || payloadConsolidado.payer?.email || 'Não informado';
  const customerName = payloadConsolidado.firstName || payloadConsolidado.name || 'Não informado';
  const orderAmount = payloadConsolidado.total || payloadConsolidado.totalAmount || payloadConsolidado.price || 'N/A';
  const transactionId = payloadConsolidado.transactionId || payloadConsolidado.id || 'N/A';

  // 1. Salva log no Firestore
  try {
    await adminDb.collection('error_logs').add({
      context,
      level,
      message: fullErrorMessage,
      stack: fullStack,
      clientIp,
      userAgent,
      requestUrl,
      requestMethod,
      customerEmail,
      customerName,
      orderAmount,
      transactionId,
      payload: JSON.parse(JSON.stringify(payloadConsolidado || {})),
      createdAt: timestampIso,
      createdAtBrt: timestampBrt,
      resolved: false,
    });
  } catch (firestoreError) {
    console.error('[ErrorNotifier] Falha ao registrar log no Firestore:', firestoreError);
  }

  // 2. Dispara e-mail de alerta para o admin via Resend
  if (!process.env.RESEND_API_KEY) {
    console.warn('[ErrorNotifier] RESEND_API_KEY não configurada. Alerta impresso apenas no console.');
    console.error(`[CRITICAL ERROR ALERT] [${level}] ${context}: ${fullErrorMessage}\nStack: ${fullStack}`);
    return;
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);

    const emailHtml = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="utf-8">
        <title>${finalSubject}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0c0d0e; color: #f3f4f6; margin: 0; padding: 24px;">
        <div style="max-width: 680px; margin: 0 auto; background-color: #16181a; border-radius: 16px; border: 1px solid #2e3238; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
          
          <!-- Banner de Alerta -->
          <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 20px 24px; text-align: left;">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <span style="font-size: 11px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; color: #ffffff; background: rgba(0,0,0,0.25); padding: 4px 10px; rounded: 6px;">
                ${level}
              </span>
              <span style="font-size: 12px; color: #fecaca; font-weight: 500;">
                ${timestampBrt}
              </span>
            </div>
            <h1 style="color: #ffffff; font-size: 20px; font-weight: 700; margin: 12px 0 4px 0; line-height: 1.3;">
              ${context}
            </h1>
          </div>

          <div style="padding: 24px;">
            <!-- Detalhe do Erro -->
            <div style="background-color: #201314; border: 1px solid #7f1d1d; border-radius: 10px; padding: 16px; margin-bottom: 20px;">
              <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #ef4444; letter-spacing: 1px; margin-bottom: 6px;">
                Mensagem da Exceção:
              </div>
              <div style="font-size: 15px; font-weight: 600; color: #fca5a5; line-height: 1.4; word-break: break-word;">
                ${fullErrorMessage}
              </div>
            </div>

            <!-- Dados da Requisição / Cliente -->
            <h3 style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #9ca3af; margin: 0 0 10px 0;">
              Dados da Requisição & Pedido
            </h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 20px; background-color: #1f2327; border-radius: 8px; overflow: hidden;">
              <tbody>
                <tr style="border-bottom: 1px solid #2e3238;">
                  <td style="padding: 10px 14px; color: #9ca3af; font-weight: 600; width: 140px;">Cliente:</td>
                  <td style="padding: 10px 14px; color: #f3f4f6;">${customerName} (${customerEmail})</td>
                </tr>
                <tr style="border-bottom: 1px solid #2e3238;">
                  <td style="padding: 10px 14px; color: #9ca3af; font-weight: 600;">Valor do Pedido:</td>
                  <td style="padding: 10px 14px; color: #34d399; font-weight: 700;">${orderAmount !== 'N/A' ? `R$ ${orderAmount}` : 'N/A'}</td>
                </tr>
                <tr style="border-bottom: 1px solid #2e3238;">
                  <td style="padding: 10px 14px; color: #9ca3af; font-weight: 600;">ID / Referência:</td>
                  <td style="padding: 10px 14px; color: #f3f4f6; font-family: monospace;">${transactionId}</td>
                </tr>
                <tr style="border-bottom: 1px solid #2e3238;">
                  <td style="padding: 10px 14px; color: #9ca3af; font-weight: 600;">IP / Rota:</td>
                  <td style="padding: 10px 14px; color: #f3f4f6;">${clientIp} ${requestMethod ? `[${requestMethod} ${requestUrl}]` : ''}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 14px; color: #9ca3af; font-weight: 600;">User-Agent:</td>
                  <td style="padding: 10px 14px; color: #9ca3af; font-size: 11px; word-break: break-all;">${userAgent}</td>
                </tr>
              </tbody>
            </table>

            <!-- Payload Recebido -->
            ${Object.keys(payloadConsolidado).length > 0 ? `
              <h3 style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #9ca3af; margin: 0 0 10px 0;">
                Payload / Itens do Pedido
              </h3>
              <pre style="background-color: #101214; border: 1px solid #2e3238; border-radius: 8px; padding: 14px; font-size: 11.5px; color: #a5f3fc; overflow-x: auto; font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; margin-bottom: 20px;">${escapeHtml(JSON.stringify(payloadConsolidado, null, 2))}</pre>
            ` : ''}

            <!-- Stack Trace -->
            <h3 style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #9ca3af; margin: 0 0 10px 0;">
              Rastreamento de Pilha (Stack Trace)
            </h3>
            <pre style="background-color: #101214; border: 1px solid #2e3238; border-radius: 8px; padding: 14px; font-size: 11px; color: #e5e7eb; overflow-x: auto; font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; line-height: 1.5; margin-bottom: 24px;">${escapeHtml(fullStack)}</pre>

            <!-- Ações Rápidas -->
            <div style="text-align: center; padding-top: 10px;">
              <a href="https://camisavetor.com.br/admin" style="display: inline-block; background-color: #fe7302; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 13px; padding: 12px 24px; border-radius: 10px; margin-right: 12px;">
                Acessar Painel Admin
              </a>
              <a href="https://console.firebase.google.com/project/camisa-vetor-app/firestore" style="display: inline-block; background-color: #2e3238; color: #f3f4f6; text-decoration: none; font-weight: 600; font-size: 13px; padding: 12px 20px; border-radius: 10px;">
                Abrir Firebase
              </a>
            </div>

          </div>

          <!-- Rodapé -->
          <div style="background-color: #101214; padding: 16px; text-align: center; border-top: 1px solid #2e3238; font-size: 11px; color: #6b7280;">
            Sistema Automático de Monitoramento Técnico • Camisa Vetor
          </div>

        </div>
      </body>
      </html>
    `;

    await resend.emails.send({
      from: SENDER_EMAIL,
      to: [ADMIN_EMAIL],
      subject: finalSubject,
      html: emailHtml,
    });

    console.log(`[ErrorNotifier] Alerta enviado com sucesso para ${ADMIN_EMAIL}: "${finalSubject}"`);
  } catch (resendError) {
    console.error('[ErrorNotifier] Erro ao disparar e-mail de alerta via Resend:', resendError);
  }
}

function escapeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
