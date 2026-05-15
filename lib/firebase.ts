import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeFirestore, memoryLocalCache } from "firebase/firestore"; // Importamos cache em memória
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyA7rCnhKpCrX-s5Y_BSmGq_N85V29-AUdA",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "camisa-vetor-app.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "camisa-vetor-app",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "camisa-vetor-app.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "213249436064",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:213249436064:web:90a28cba6cf4c2ae871cc5",
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