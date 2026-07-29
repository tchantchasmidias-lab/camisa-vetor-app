'use client';

/**
 * Studio Login — Autenticação de admin via Firebase Auth (Google Sign-In).
 * Após login bem-sucedido, cria o cookie __session e redireciona ao editor.
 */

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { initializeApp, getApps } from 'firebase/app';

// Inicializa o Firebase App (reutiliza se já existir)
const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0
  ? initializeApp(firebaseConfig)
  : getApps()[0];

export default function StudioLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') ?? '/studio';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Detecta se estamos em localhost (dev)
  const [isDev, setIsDev] = useState(false);
  useEffect(() => {
    setIsDev(
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1'
    );
  }, []);

  /** Acesso direto em modo desenvolvimento — sem Firebase */
  const handleDevAccess = () => {
    router.replace(callbackUrl);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const auth = getAuth(app);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      // Obtém o ID token e cria o cookie de sessão via API route
      const idToken = await result.user.getIdToken();
      const res = await fetch('/studio/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Acesso negado. Verifique se sua conta tem permissão de admin.');
      }

      router.replace(callbackUrl);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao fazer login.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center
                    bg-[#0e1014] relative overflow-hidden">
      {/* Fundo gradiente animado */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-900/10 via-transparent to-orange-800/5" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-orange-600/8 rounded-full blur-2xl" />

      {/* Card de login */}
      <div className="relative z-10 w-full max-w-sm mx-4">
        <div className="bg-[#1a1d24] border border-white/8 rounded-2xl p-8 shadow-2xl
                        shadow-black/50">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-700
                            flex items-center justify-center text-2xl font-bold text-white
                            shadow-lg shadow-orange-500/30 mb-4">
              CV
            </div>
            <h1 className="text-xl font-bold text-white">Camisa Vetor Studio</h1>
            <p className="text-sm text-gray-500 mt-1">Acesso restrito ao administrador</p>
          </div>

          {/* Erro */}
          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20
                            text-sm text-red-400">
              {error}
            </div>
          )}

          {/* ── Botão de acesso DEV (só aparece em localhost) ── */}
          {isDev && (
            <div className="mb-4">
              <button
                onClick={handleDevAccess}
                className="w-full flex items-center justify-center gap-2
                           bg-emerald-500/15 hover:bg-emerald-500/25
                           border border-emerald-500/40 hover:border-emerald-400/60
                           text-emerald-300 text-sm font-semibold py-3 px-4 rounded-xl
                           transition-all duration-200 active:scale-[0.98]"
              >
                <span className="text-base">🧪</span>
                Acesso Dev (apenas localhost)
              </button>
              <p className="text-center text-[11px] text-gray-600 mt-2">
                Bypass de autenticação — não aparece em produção
              </p>
            </div>
          )}

          {/* Divisor visual */}
          {isDev && (
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-white/8" />
              <span className="text-xs text-gray-600">ou entre com Google</span>
              <div className="flex-1 h-px bg-white/8" />
            </div>
          )}

          {/* Botão Google Sign-In */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3
                       bg-white hover:bg-gray-100 text-gray-800 font-medium rounded-xl
                       transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed
                       active:scale-[0.98] shadow-lg"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent
                              rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            {loading ? 'Autenticando...' : 'Entrar com Google'}
          </button>

          <p className="text-center text-xs text-gray-600 mt-6">
            Apenas contas autorizadas têm acesso ao Studio.
          </p>
        </div>
      </div>
    </div>
  );
}
