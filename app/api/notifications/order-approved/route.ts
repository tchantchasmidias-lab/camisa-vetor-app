import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import * as admin from 'firebase-admin';

export async function POST(request: NextRequest) {
  try {
    // Verifica autenticação de admin
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(token);
    } catch {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    if (decodedToken.email !== 'camisavetor@gmail.com') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, orderId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId obrigatório' }, { status: 400 });
    }

    // Busca TODOS os tokens FCM do usuário (suporte multi-device)
    const tokensSnap = await adminDb
      .collection('fcm_tokens')
      .where('userId', '==', userId)
      .get();

    if (tokensSnap.empty) {
      return NextResponse.json({
        success: false,
        message: 'Usuário sem dispositivo registrado para notificações',
      });
    }

    const fcmTokens: string[] = [];
    tokensSnap.docs.forEach((d) => {
      const t = d.data()?.token;
      if (t) fcmTokens.push(t);
    });

    if (fcmTokens.length === 0) {
      return NextResponse.json({ success: false, message: 'Tokens FCM inválidos' });
    }

    const message: admin.messaging.MulticastMessage = {
      tokens: fcmTokens,
      notification: {
        title: '✅ Pedido aprovado!',
        body: 'Seus vetores estão prontos para download. Clique para acessar.',
      },
      data: {
        url: '/downloads',
        tag: 'order-approved',
        orderId: orderId || '',
      },
      webpush: {
        notification: {
          icon: 'https://camisavetor.com/pwa-icon-192.png',
          badge: 'https://camisavetor.com/pwa-icon-192.png',
          vibrate: [300, 100, 300],
          requireInteraction: true,
        },
        fcmOptions: {
          link: 'https://camisavetor.com/downloads',
        },
      },
    };

    const response = await admin.messaging().sendEachForMulticast(message);

    // Remove tokens inválidos
    const batch = adminDb.batch();
    let hasInvalid = false;
    response.responses.forEach((resp, idx) => {
      if (!resp.success && resp.error?.code === 'messaging/registration-token-not-registered') {
        const docToDelete = tokensSnap.docs.find((d) => d.data().token === fcmTokens[idx]);
        if (docToDelete) {
          batch.delete(docToDelete.ref);
          hasInvalid = true;
        }
      }
    });
    if (hasInvalid) await batch.commit();

    return NextResponse.json({ success: true, sent: response.successCount, total: fcmTokens.length });
  } catch (error: any) {
    console.error('[Notif] Erro ao enviar notificação de pedido aprovado:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
