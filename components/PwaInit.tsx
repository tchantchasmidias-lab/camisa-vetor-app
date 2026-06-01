'use client';

import { useEffect, useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import {
  requestNotificationPermission,
  saveFcmToken,
  onForegroundMessage,
  getNotificationPermissionStatus,
} from '@/lib/messaging';

const PERMISSION_ASKED_KEY = 'cv_notif_asked_at';
const ASK_AGAIN_DAYS = 7;

export default function PwaInit() {
  const unsubForeground = useRef<(() => void) | undefined>(undefined);

  useEffect(() => {
    // 1. Registrar o Service Worker do Firebase Messaging
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/firebase-messaging-sw.js')
        .then((reg) => console.log('[PWA] Service Worker registrado:', reg.scope))
        .catch((err) => console.error('[PWA] Erro ao registrar SW:', err));
    }

    // 2. Monitorar login do usuário para salvar token FCM
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      const status = getNotificationPermissionStatus();

      // Se já foi concedida, apenas atualiza o token
      if (status === 'granted') {
        const token = await requestNotificationPermission();
        if (token) await saveFcmToken(user.uid, token);
        setupForegroundHandler();
        return;
      }

      // Se recusou, não pergunta de novo
      if (status === 'denied') return;

      // Se ainda não perguntou ou já passou N dias, pede permissão
      const lastAsked = localStorage.getItem(PERMISSION_ASKED_KEY);
      const now = Date.now();
      const shouldAsk =
        !lastAsked ||
        now - parseInt(lastAsked) > ASK_AGAIN_DAYS * 24 * 60 * 60 * 1000;

      if (!shouldAsk) return;

      // Aguarda 4 segundos para não ser intrusivo na abertura
      setTimeout(async () => {
        localStorage.setItem(PERMISSION_ASKED_KEY, String(now));
        const token = await requestNotificationPermission();
        if (token) {
          await saveFcmToken(user.uid, token);
          setupForegroundHandler();
        }
      }, 4000);
    });

    return () => {
      unsubAuth();
      unsubForeground.current?.();
    };
  }, []);

  // Handler para notificações com o app ABERTO (foreground)
  function setupForegroundHandler() {
    unsubForeground.current?.(); // Remove handler anterior se existir

    const unsub = onForegroundMessage((payload) => {
      console.log('[FCM] Notificação em foreground:', payload);

      // Exibe como uma notificação nativa mesmo com app aberto
      if (Notification.permission === 'granted') {
        const title = payload.notification?.title || 'Camisa Vetor';
        const body = payload.notification?.body || '';
        const url = payload.data?.url || '/';

        const notif = new Notification(title, {
          body,
          icon: '/icons/icon-192.png',
          badge: '/icons/icon-192.png',
        });

        notif.onclick = () => {
          window.focus();
          window.location.href = url;
        };
      }
    });

    unsubForeground.current = unsub;
  }

  // Componente não renderiza nada visível
  return null;
}
