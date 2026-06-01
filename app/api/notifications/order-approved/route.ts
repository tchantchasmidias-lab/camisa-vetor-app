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

    // Busca o token FCM do usuário específico
    const tokenDoc = await adminDb.collection('fcm_tokens').doc(userId).get();

    if (!tokenDoc.exists) {
      return NextResponse.json({
        success: false,
        message: 'Usuário sem dispositivo registrado para notificações',
      });
    }

    const fcmToken = tokenDoc.data()?.token;
    if (!fcmToken) {
      return NextResponse.json({ success: false, message: 'Token FCM inválido' });
    }

    const message: admin.messaging.Message = {
      token: fcmToken,
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
          icon: '/icons/icon-192.png',
          badge: '/icons/icon-192.png',
          vibrate: [300, 100, 300],
          requireInteraction: true, // Mantém a notificação até o usuário interagir
        },
        fcmOptions: {
          link: '/downloads',
        },
      },
    };

    await admin.messaging().send(message);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    // Se o token é inválido, remove do Firestore
    if (error.code === 'messaging/registration-token-not-registered') {
      const body = await request.json().catch(() => ({}));
      if (body.userId) {
        await adminDb.collection('fcm_tokens').doc(body.userId).delete();
      }
    }

    console.error('[Notif] Erro ao enviar notificação de pedido aprovado:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
