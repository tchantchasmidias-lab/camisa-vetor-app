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
    const { productName, productSlug } = body;

    if (!productName) {
      return NextResponse.json({ error: 'Nome do produto obrigatório' }, { status: 400 });
    }

    // Busca todos os tokens FCM cadastrados
    const tokensSnap = await adminDb.collection('fcm_tokens').get();
    if (tokensSnap.empty) {
      return NextResponse.json({ success: true, sent: 0, message: 'Nenhum dispositivo registrado' });
    }

    const tokens: string[] = [];
    tokensSnap.docs.forEach((doc) => {
      const data = doc.data();
      if (data.token) tokens.push(data.token);
    });

    if (tokens.length === 0) {
      return NextResponse.json({ success: true, sent: 0 });
    }

    // Envia em lotes de 500 (limite do FCM)
    const chunkSize = 500;
    let totalSent = 0;
    let totalFailed = 0;

    for (let i = 0; i < tokens.length; i += chunkSize) {
      const chunk = tokens.slice(i, i + chunkSize);

      const message: admin.messaging.MulticastMessage = {
        tokens: chunk,
        notification: {
          title: '🎨 Novo vetor disponível!',
          body: productName,
        },
        data: {
          url: productSlug ? `/product/${productSlug}` : '/',
          tag: 'new-product',
        },
        webpush: {
          notification: {
            icon: 'https://camisavetor.com/pwa-icon-192.png',
            badge: 'https://camisavetor.com/pwa-icon-192.png',
            vibrate: [200, 100, 200],
          },
          fcmOptions: {
            link: productSlug ? `https://camisavetor.com/product/${productSlug}` : 'https://camisavetor.com',
          },
        },
      };

      const response = await admin.messaging().sendEachForMulticast(message);
      totalSent += response.successCount;
      totalFailed += response.failureCount;

      // Remove tokens inválidos do Firestore
      const failedTokens: string[] = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success && resp.error?.code === 'messaging/registration-token-not-registered') {
          failedTokens.push(chunk[idx]);
        }
      });

      if (failedTokens.length > 0) {
        const batch = adminDb.batch();
        tokensSnap.docs.forEach((docSnap) => {
          if (failedTokens.includes(docSnap.data().token)) {
            batch.delete(docSnap.ref);
          }
        });
        await batch.commit();
      }
    }

    return NextResponse.json({
      success: true,
      sent: totalSent,
      failed: totalFailed,
      total: tokens.length,
    });
  } catch (error: any) {
    console.error('[Notif] Erro ao enviar notificação de novo produto:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
