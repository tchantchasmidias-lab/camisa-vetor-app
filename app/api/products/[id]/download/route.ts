import { NextResponse } from 'next/server';
import * as admin from 'firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';
import { acquireLock, checkRateLimit, releaseLock } from '@/lib/rateLimit';
import { hasActiveEntitlement, hasRedeemed, DownloadHistoryEntry } from '@/lib/subscriptions';

const SIGNED_URL_TTL_MS = 5 * 60 * 1000;

/** Extrai bucket/objeto de URLs do Firebase Storage / GCS (https ou gs://). */
function parseStorageLocation(url: string): { bucket: string; path: string } | null {
  try {
    if (url.startsWith('gs://')) {
      const [bucket, ...rest] = url.slice(5).split('/');
      return bucket && rest.length ? { bucket, path: rest.join('/') } : null;
    }
    const u = new URL(url);
    if (u.hostname === 'firebasestorage.googleapis.com') {
      const m = u.pathname.match(/^\/v0\/b\/([^/]+)\/o\/(.+)$/);
      if (m) return { bucket: m[1], path: decodeURIComponent(m[2]) };
    }
    if (u.hostname === 'storage.googleapis.com') {
      const [, bucket, ...rest] = u.pathname.split('/');
      if (bucket && rest.length) return { bucket, path: decodeURIComponent(rest.join('/')) };
    }
  } catch {
    /* URL inválida */
  }
  return null;
}

async function buildSignedUrl(rawUrl: string): Promise<string> {
  const loc = parseStorageLocation(rawUrl);
  if (!loc) return rawUrl; // link externo (não é Cloud Storage): mantém o comportamento atual
  try {
    const [signed] = await admin
      .storage()
      .bucket(loc.bucket)
      .file(loc.path)
      .getSignedUrl({
        version: 'v4',
        action: 'read',
        expires: Date.now() + SIGNED_URL_TTL_MS,
        responseDisposition: 'attachment',
      });
    return signed;
  } catch (err: any) {
    // Sem permissão de assinatura (ex.: credencial sem signBlob): preserva o fluxo atual
    console.error('[download] falha ao assinar URL, usando link original:', err?.message);
    return rawUrl;
  }
}

/**
 * POST (e não GET) porque a chamada pode debitar crédito — evita prefetch/crawlers.
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const productId = params.id;
  let lockKey: string | null = null;

  try {
    if (!productId) {
      return NextResponse.json({ error: 'ID do produto não fornecido' }, { status: 400 });
    }

    // 1. Autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Autenticação necessária' }, { status: 401 });
    }
    let uid: string;
    try {
      uid = (await adminAuth.verifyIdToken(authHeader.split('Bearer ')[1])).uid;
    } catch {
      return NextResponse.json({ error: 'Sessão inválida ou expirada' }, { status: 401 });
    }

    // 2. Anti-scraping: janela de requisições + uma requisição simultânea por usuário
    if (!checkRateLimit(`dl:${uid}`, 10, 60_000)) {
      return NextResponse.json({ error: 'Muitas requisições. Aguarde um momento.' }, { status: 429 });
    }
    lockKey = `dl-lock:${uid}`;
    if (!acquireLock(lockKey)) {
      lockKey = null;
      return NextResponse.json({ error: 'Já existe um download em andamento.' }, { status: 429 });
    }

    // 3. Produto e arquivo
    const productSnap = await adminDb.collection('products').doc(productId).get();
    if (!productSnap.exists) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
    }
    const p = productSnap.data()!;
    const fileUrl: string | undefined = p?.urls?.download || p?.downloadUrl || p?.fileUrl;
    if (!fileUrl || fileUrl === '#') {
      return NextResponse.json({ error: 'Arquivo indisponível no momento. Contate o suporte.' }, { status: 404 });
    }

    const userRef = adminDb.collection('users').doc(uid);

    // 4. Compra avulsa aprovada → acesso vitalício (não consome crédito)
    const orders = await adminDb
      .collection('pedidos')
      .where('userId', '==', uid)
      .where('status', '==', 'pago')
      .get();
    const purchased = orders.docs.some((d) => {
      const items = d.data().items;
      return Array.isArray(items) && items.some((i: any) => i.id === productId);
    });

    if (purchased) {
      // Registra no histórico apenas uma vez por produto
      await adminDb.runTransaction(async (tx) => {
        const snap = await tx.get(userRef);
        const history: DownloadHistoryEntry[] = snap.data()?.downloadHistory ?? [];
        if (history.some((h) => h.productId === productId)) return;
        tx.set(
          userRef,
          {
            downloadHistory: [
              ...history,
              { productId, downloadedAt: Timestamp.now(), method: 'direct_purchase' },
            ],
          },
          { merge: true }
        );
      });
      return NextResponse.json({
        success: true,
        method: 'direct_purchase',
        downloadUrl: await buildSignedUrl(fileUrl),
        expiresInSeconds: SIGNED_URL_TTL_MS / 1000,
      });
    }

    // 5. Assinante: débito atômico de 1 crédito (ou reaproveita resgate anterior)
    type Outcome =
      | { ok: true; charged: boolean; remaining: number }
      | { ok: false; code: 'NOT_SUBSCRIBER' | 'NO_CREDITS' };

    const outcome = await adminDb.runTransaction<Outcome>(async (tx) => {
      const snap = await tx.get(userRef);
      const user = snap.data();
      if (!hasActiveEntitlement(user)) return { ok: false, code: 'NOT_SUBSCRIBER' };

      const credits = Number(user?.availableCredits) || 0;
      if (hasRedeemed(user, productId)) {
        return { ok: true, charged: false, remaining: credits };
      }
      if (credits <= 0) return { ok: false, code: 'NO_CREDITS' };

      const history: DownloadHistoryEntry[] = user?.downloadHistory ?? [];
      tx.update(userRef, {
        availableCredits: credits - 1,
        downloadHistory: [...history, { productId, downloadedAt: Timestamp.now(), method: 'credit' }],
      });
      return { ok: true, charged: true, remaining: credits - 1 };
    });

    if (!outcome.ok) {
      const msg =
        outcome.code === 'NO_CREDITS'
          ? 'Seus créditos do ciclo acabaram. Eles serão renovados na próxima cobrança.'
          : 'Você não possui compra deste vetor nem uma assinatura ativa.';
      return NextResponse.json({ error: msg, code: outcome.code }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      method: 'credit',
      charged: outcome.charged,
      remainingCredits: outcome.remaining,
      downloadUrl: await buildSignedUrl(fileUrl),
      expiresInSeconds: SIGNED_URL_TTL_MS / 1000,
    });
  } catch (error: any) {
    console.error('[products/download] erro:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  } finally {
    if (lockKey) releaseLock(lockKey);
  }
}
