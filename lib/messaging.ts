import { getMessaging, getToken, onMessage, MessagePayload } from 'firebase/messaging';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { app, db } from './firebase';

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

/**
 * Inicializa o Firebase Messaging (somente no browser).
 */
function getFirebaseMessaging() {
  if (typeof window === 'undefined') return null;
  try {
    return getMessaging(app);
  } catch {
    return null;
  }
}

/**
 * Solicita permissão de notificação ao usuário e retorna o token FCM.
 * Retorna null se o usuário recusar ou se o browser não suportar.
 */
export async function requestNotificationPermission(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  if (!('Notification' in window)) return null;
  if (!('serviceWorker' in navigator)) return null;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;

    const messaging = getFirebaseMessaging();
    if (!messaging) return null;

    const registration = await navigator.serviceWorker.ready;

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    return token || null;
  } catch (error) {
    console.error('[FCM] Erro ao obter token:', error);
    return null;
  }
}

/**
 * Salva o token FCM no Firestore vinculado ao userId.
 */
export async function saveFcmToken(userId: string, token: string): Promise<void> {
  try {
    await setDoc(
      doc(db, 'fcm_tokens', userId),
      {
        token,
        updatedAt: serverTimestamp(),
        platform: 'web',
      },
      { merge: true }
    );
  } catch (error) {
    console.error('[FCM] Erro ao salvar token:', error);
  }
}

/**
 * Registra callback para notificações recebidas com o app ABERTO (foreground).
 */
export function onForegroundMessage(callback: (payload: MessagePayload) => void): (() => void) | undefined {
  const messaging = getFirebaseMessaging();
  if (!messaging) return undefined;

  return onMessage(messaging, callback);
}

/**
 * Verifica se o usuário já deu/negou permissão anteriormente.
 */
export function getNotificationPermissionStatus(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined') return 'unsupported';
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
}
