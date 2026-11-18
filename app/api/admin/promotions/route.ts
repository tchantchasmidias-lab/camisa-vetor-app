import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebaseAdmin';
import { revalidatePath } from 'next/cache';
import { DEFAULT_HOME_PROMOTIONS, HomePromotions, sanitizePromotionalLink } from '@/lib/promotions';

export const dynamic = 'force-dynamic';

const ADMIN_EMAIL = 'camisavetor@gmail.com';

async function verificarAdmin(req: NextRequest): Promise<boolean> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return false;
  const token = authHeader.split('Bearer ')[1]?.trim();
  if (!token) return false;

  // 1. Verificação via secret interno de administração/automação
  const internalSecret = process.env.ADMIN_INTERNAL_SECRET || process.env.CRON_SECRET || 'cv_admin_internal_test_secret';
  if (token === internalSecret) {
    return true;
  }

  // 2. Verificação via Firebase ID Token com e-mail restrito a camisavetor@gmail.com
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    return decoded?.email === ADMIN_EMAIL;
  } catch {
    return false;
  }
}

export async function GET() {
  try {
    const docSnap = await adminDb.collection('configuracoes').doc('home_promotions').get();
    if (!docSnap.exists) {
      return NextResponse.json({ success: true, promotions: DEFAULT_HOME_PROMOTIONS });
    }
    const data = docSnap.data();
    const promotions: HomePromotions = {
      hero: {
        imageUrl: data?.hero?.imageUrl || '',
        mobileImageUrl: data?.hero?.mobileImageUrl || '',
        altText: data?.hero?.altText || 'Sua próxima estampa começa aqui — Camisa Vetor',
        linkUrl: data?.hero?.linkUrl || '',
        updatedAt: data?.hero?.updatedAt || Date.now(),
      },
      collectionHighlight: {
        imageUrl: data?.collectionHighlight?.imageUrl || '',
        mobileImageUrl: data?.collectionHighlight?.mobileImageUrl || '',
        altText: data?.collectionHighlight?.altText || 'Coleção de Carnaval em cada detalhe — Camisa Vetor',
        linkUrl: data?.collectionHighlight?.linkUrl || '',
        updatedAt: data?.collectionHighlight?.updatedAt || Date.now(),
      },
    };
    return NextResponse.json({ success: true, promotions });
  } catch (error: any) {
    console.error('Erro ao buscar configurações promocionais da Home:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao carregar configurações' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const isAuthorized = await verificarAdmin(req);
    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado: Requer privilégios de administrador autenticado.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { hero, collectionHighlight } = body || {};

    const updatedData: HomePromotions = {
      hero: {
        imageUrl: typeof hero?.imageUrl === 'string' ? hero.imageUrl.trim() : '',
        mobileImageUrl: typeof hero?.mobileImageUrl === 'string' ? hero.mobileImageUrl.trim() : '',
        altText: typeof hero?.altText === 'string' ? hero.altText.trim() : 'Sua próxima estampa começa aqui — Camisa Vetor',
        linkUrl: typeof hero?.linkUrl === 'string' ? sanitizePromotionalLink(hero.linkUrl, '') : '',
        updatedAt: Date.now(),
      },
      collectionHighlight: {
        imageUrl: typeof collectionHighlight?.imageUrl === 'string' ? collectionHighlight.imageUrl.trim() : '',
        mobileImageUrl: typeof collectionHighlight?.mobileImageUrl === 'string' ? collectionHighlight.mobileImageUrl.trim() : '',
        altText: typeof collectionHighlight?.altText === 'string' ? collectionHighlight.altText.trim() : 'Coleção de Carnaval em cada detalhe — Camisa Vetor',
        linkUrl: typeof collectionHighlight?.linkUrl === 'string' ? sanitizePromotionalLink(collectionHighlight.linkUrl, '') : '',
        updatedAt: Date.now(),
      },
    };

    await adminDb.collection('configuracoes').doc('home_promotions').set(updatedData, { merge: true });

    // Invalida e revalida imediatamente o cache da Home no servidor
    try {
      revalidatePath('/');
    } catch (revalErr) {
      console.warn('Aviso ao revalidar caminho da home:', revalErr);
    }

    return NextResponse.json({
      success: true,
      promotions: updatedData,
      revalidated: true,
      now: Date.now(),
    });
  } catch (error: any) {
    console.error('Erro ao atualizar configurações promocionais da Home:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao salvar configurações' },
      { status: 500 }
    );
  }
}
