import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeFirestore, memoryLocalCache } from "firebase/firestore"; // Importamos cache em memória
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// CONFIGURAÇÃO ROBUSTA: Força o Firebase a conectar mesmo em ambientes restritos (IDX)
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true, // Força a conexão estável
  localCache: memoryLocalCache(),     // Evita erros de indexDB no navegador
});

const auth = getAuth(app);
const storage = getStorage(app);

export { app, db, auth, storage };