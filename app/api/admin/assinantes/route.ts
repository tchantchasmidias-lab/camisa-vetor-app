import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebaseAdmin';

const ADMIN_EMAIL = 'camisavetor@gmail.com';

async function verificarAdmin(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.split('Bearer ')[1];
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    if (decoded.email !== ADMIN_EMAIL) return null;
    return decoded;
  } catch {
    return null;
  }
}

// GET — Lista todos os assinantes e calcula métricas gerais
export async function GET(req: Request) {
  try {
    const decoded = await verificarAdmin(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    // Busca usuários marcados como assinantes
    const usersSnap = await adminDb
      .collection('users')
      .where('isSubscriber', '==', true)
      .get();

    let totalAvailableCredits = 0;
    let planProCount = 0;
    let planGraficaCount = 0;
    let methodCardCount = 0;
    let methodPixCount = 0;
    let totalDownloadsCount = 0;

    const assinantes = usersSnap.docs.map((doc) => {
      const data = doc.data();
      const credits = Number(data.availableCredits) || 0;
      const plan = data.subscriptionPlan === 'grafica' ? 'grafica' : 'pro';
      const subId = String(data.subscriptionId || '');
      const isPix = subId.startsWith('pix_') || data.subscriptionMethod === 'pix';
      const method = isPix ? 'pix' : 'card';
      const status = data.subscriptionStatus || 'active';

      // Histórico de downloads (suporta downloadHistory, redeemedProducts ou downloads)
      const rawHistory = Array.isArray(data.downloadHistory)
        ? data.downloadHistory
        : Array.isArray(data.redeemedProducts)
        ? data.redeemedProducts
        : Array.isArray(data.downloads)
        ? data.downloads
        : [];

      totalAvailableCredits += credits;
      totalDownloadsCount += rawHistory.length;

      if (status === 'active' || data.isSubscriber === true) {
        if (plan === 'grafica') planGraficaCount++;
        else planProCount++;

        if (isPix) methodPixCount++;
        else methodCardCount++;
      }

      return {
        uid: doc.id,
        name: data.nome || data.name || data.displayName || 'Sem nome',
        email: data.email || '',
        phone: data.phone || '',
        cpf: data.cpf || '',
        photoURL: data.photoURL || '',
        isSubscriber: data.isSubscriber === true,
        subscriptionPlan: plan,
        subscriptionStatus: status,
        subscriptionId: subId,
        subscriptionMethod: method,
        subscriptionExpiresAt: data.subscriptionExpiresAt || data.subscriptionRenewsAt || null,
        subscriptionRenewsAt: data.subscriptionRenewsAt || null,
        monthlyCredits: Number(data.monthlyCredits) || (plan === 'grafica' ? 40 : 15),
        availableCredits: credits,
        downloadHistory: rawHistory,
        createdAt: data.createdAt || null,
        lastSubscriptionActivatedAt: data.lastSubscriptionActivatedAt || null,
      };
    });

    // Ordena os assinantes por data de ativação/renovação decrescente
    assinantes.sort((a, b) => {
      const dateA = a.subscriptionExpiresAt?._seconds
        ? a.subscriptionExpiresAt._seconds * 1000
        : new Date(a.subscriptionExpiresAt || 0).getTime();
      const dateB = b.subscriptionExpiresAt?._seconds
        ? b.subscriptionExpiresAt._seconds * 1000
        : new Date(b.subscriptionExpiresAt || 0).getTime();
      return dateB - dateA;
    });

    return NextResponse.json({
      assinantes,
      metricas: {
        totalSubscribers: assinantes.length,
        planProCount,
        planGraficaCount,
        methodCardCount,
        methodPixCount,
        totalAvailableCredits,
        totalDownloadsCount,
      },
    });
  } catch (error: any) {
    console.error('Erro ao listar assinantes:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
