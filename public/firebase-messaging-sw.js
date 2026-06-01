// Firebase Messaging Service Worker — Camisa Vetor
// IMPORTANTE: Este arquivo DEVE se chamar "firebase-messaging-sw.js"
// e ficar na raiz do /public para o FCM funcionar.

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyA7rCnhKpCrX-s5Y_BSmGq_N85V29-AUdA',
  authDomain: 'camisa-vetor-app.firebaseapp.com',
  projectId: 'camisa-vetor-app',
  storageBucket: 'camisa-vetor-app.firebasestorage.app',
  messagingSenderId: '213249436064',
  appId: '1:213249436064:web:90a28cba6cf4c2ae871cc5',
});

const messaging = firebase.messaging();

// Recebe notificações quando o app está em BACKGROUND ou FECHADO
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Notificação recebida em background:', payload);

  const notificationTitle = payload.notification?.title || 'Camisa Vetor';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    vibrate: [200, 100, 200],
    tag: payload.data?.tag || 'camisa-vetor',
    renotify: true,
    data: {
      url: payload.data?.url || '/',
    },
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Ao clicar na notificação, abre a URL correta no app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Se o app já está aberto, foca nele e navega
        for (const client of clientList) {
          if ('focus' in client) {
            client.focus();
            client.navigate(targetUrl);
            return;
          }
        }
        // Senão, abre uma nova janela
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});

// Cache básico para funcionamento offline
const CACHE_NAME = 'camisa-vetor-v1';
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/logo.svg',
  '/logo-mobile.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Só lida com requisições GET
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Ignora requisições de API e Firebase
  if (url.pathname.startsWith('/api/') || url.hostname.includes('firebase')) return;

  event.respondWith(
    fetch(event.request)
      .catch(() =>
        caches.match(event.request).then(
          (cached) => cached || caches.match('/offline')
        )
      )
  );
});
