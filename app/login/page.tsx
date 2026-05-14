'use client';

import { useState, Suspense, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Mail, Lock, Loader2, ArrowRight, AlertCircle, UserPlus, User, FileText, Phone, Eye, EyeOff } from 'lucide-react';
import { useGeo } from '@/lib/i18n/GeoContext';

function LoginPageContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/perfil';

  const { t, isInternational } = useGeo();
  
  useEffect(() => {
    // Congela a rolagem do body para evitar barras duplas
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const maskCPF = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const maskPhone = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1');
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isRegistering) {
        if (password !== confirmPassword) {
          throw new Error(t('passwordMismatch'));
        }
        if (!isInternational && cpf.length < 14) {
          throw new Error(t('incompleteCpf'));
        }
        if (!isInternational && phone.length < 15) {
          throw new Error(t('incompleteWhatsapp'));
        }
        if (nome.length < 3) {
          throw new Error(t('fullNameRequired'));
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          nome,
          cpf,
          phone,
          email,
          createdAt: new Date().toISOString()
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      router.push(redirectUrl);
    } catch (err: any) {
      console.error(err);
      if ([t('incompleteCpf'), t('incompleteWhatsapp'), t('fullNameRequired'), t('passwordMismatch')].includes(err.message)) {
        setError(err.message);
      } else if (err.code === 'auth/email-already-in-use') {
        setError(t('emailInUse'));
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        setError(t('invalidCredentials'));
      } else if (err.code === 'auth/weak-password') {
        setError(t('weakPassword'));
      } else {
        setError(t('authError'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      const userRef = doc(db, 'users', result.user.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          nome: result.user.displayName || '',
          email: result.user.email || '',
          createdAt: new Date().toISOString()
        });
      }
      router.push(redirectUrl);
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/operation-not-allowed') {
        setError(t('googleLoginDisabled'));
      } else if (error.code === 'auth/popup-closed-by-user') {
        setError(t('popupClosed'));
      } else {
        setError(t('googleLoginError'));
      }
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError(t('emailRequiredForReset'));
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
      setError('');
    } catch (err: any) {
      console.error(err);
      setError(t('resetError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] bg-[#050505] flex items-start justify-center p-4 font-sans overflow-x-hidden overflow-y-auto selection:bg-[#fe7302]/30">
      {/* Efeitos de Fundo (Glows Profissionais) */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#fe7302]/10 blur-[150px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#fe7302]/5 blur-[150px] rounded-full pointer-events-none"></div>

      <div className="max-w-md w-full pt-[28px] pb-8 relative z-10 animate-in fade-in zoom-in-95 duration-1000">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-6 hover:scale-105 transition-transform duration-500">
             <Image 
                src="/logo.svg" 
                alt="Camisa Vetor" 
                width={160} 
                height={40} 
                priority 
                className="h-9 w-auto" 
             />
          </div>
          <div className="text-center">
            <h2 className="text-[12px] font-black text-white tracking-[0.5em] uppercase mb-1 opacity-80">
              {isRegistering ? t('createAccount') : t('clientAccess')}
            </h2>
            <div className="flex items-center justify-center gap-3">
              <div className="h-[1px] w-5 bg-gradient-to-r from-transparent to-[#fe7302]/30"></div>
              <p className="text-[8px] font-bold text-[#fe7302] uppercase tracking-[0.4em]">{isRegistering ? 'Novo Membro' : 'Bem-vindo'}</p>
              <div className="h-[1px] w-5 bg-gradient-to-l from-transparent to-[#fe7302]/30"></div>
            </div>
          </div>
        </div>

        <div className="bg-[#111111]/80 backdrop-blur-3xl p-6 md:p-10 rounded-[2rem] border border-white/5 shadow-[0_40px_80px_rgba(0,0,0,0.8)] relative overflow-hidden">
          {/* Detalhe de borda neon suave */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[40%] h-[1px] bg-gradient-to-r from-transparent via-[#fe7302]/40 to-transparent"></div>

          <form onSubmit={handleAuth} className="space-y-2">
            
            {isRegistering && (
              <>
                <div className="space-y-0.5">
                  <label className="text-[9px] font-black uppercase text-gray-500 ml-4 tracking-[0.2em]">{t('fullName')}</label>
                  <div className="relative group">
                    <User className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-[#fe7302] transition-colors" size={18} />
                    <input 
                      type="text" required placeholder={t('fullName')}
                      value={nome} onChange={(e) => setNome(e.target.value)}
                      className="w-full bg-white border border-white/10 rounded-2xl p-[10px] pl-14 text-[12px] text-gray-900 font-semibold outline-none focus:border-[#fe7302]/50 focus:ring-1 focus:ring-[#fe7302]/20 transition-all placeholder:text-gray-400"
                    />
                  </div>
                </div>

                {!isInternational && (
                  <div className="space-y-2">
                    <div className="space-y-0.5">
                      <label className="text-[9px] font-black uppercase text-gray-500 ml-4 tracking-[0.2em]">{t('cpf')}</label>
                      <div className="relative group">
                        <FileText className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-[#fe7302] transition-colors" size={16} />
                        <input 
                          type="text" required placeholder="000.000.000-00"
                          value={cpf} onChange={(e) => setCpf(maskCPF(e.target.value))}
                          className="w-full bg-white border border-white/10 rounded-2xl p-2.5 pl-12 text-[11px] text-gray-900 font-semibold outline-none focus:border-[#fe7302]/50 focus:ring-1 focus:ring-[#fe7302]/20 transition-all placeholder:text-gray-400"
                        />
                      </div>
                    </div>

                    <div className="space-y-0.5">
                      <label className="text-[9px] font-black uppercase text-gray-500 ml-4 tracking-[0.2em]">{t('whatsapp')}</label>
                      <div className="relative group">
                        <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-[#fe7302] transition-colors" size={16} />
                        <input 
                          type="text" required placeholder="(00) 00000-0000"
                          value={phone} onChange={(e) => setPhone(maskPhone(e.target.value))}
                          className="w-full bg-white border border-white/10 rounded-2xl p-2.5 pl-12 text-[11px] text-gray-900 font-semibold outline-none focus:border-[#fe7302]/50 focus:ring-1 focus:ring-[#fe7302]/20 transition-all placeholder:text-gray-400"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase text-gray-500 ml-4 tracking-[0.2em]">{t('email')}</label>
              <div className="relative group">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-[#fe7302] transition-colors" size={18} />
                <input 
                  type="email" required placeholder={t('email')}
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white border border-white/10 rounded-2xl p-[10px] pl-14 text-[12px] text-gray-900 font-semibold outline-none focus:border-[#fe7302]/50 focus:ring-1 focus:ring-[#fe7302]/20 transition-all placeholder:text-gray-400"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase text-gray-500 ml-4 tracking-[0.2em]">{t('password')}</label>
              <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-[#fe7302] transition-colors" size={18} />
                <input 
                  type={showPassword ? "text" : "password"} required placeholder={t('password')}
                  value={password} onChange={(e) => setPassword(e.target.value)} minLength={6}
                  className="w-full bg-white border border-white/10 rounded-2xl p-[10px] pl-14 pr-14 text-[12px] text-gray-900 font-semibold outline-none focus:border-[#fe7302]/50 focus:ring-1 focus:ring-[#fe7302]/20 transition-all placeholder:text-gray-400"
                />
                <button
                  type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-600 hover:text-[#fe7302] transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {isRegistering && (
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-gray-500 ml-4 tracking-[0.2em]">{t('confirmPassword')}</label>
                <div className="relative group">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-[#fe7302] transition-colors" size={18} />
                  <input 
                    type={showConfirmPassword ? "text" : "password"} required placeholder={t('confirmPassword')}
                    value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} minLength={6}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 pl-14 pr-14 text-[12px] text-white font-medium outline-none focus:border-[#fe7302]/50 focus:bg-white/[0.08] transition-all placeholder:text-gray-700"
                  />
                  <button
                    type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-600 hover:text-[#fe7302] transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3 text-red-400 bg-red-500/5 p-4 rounded-2xl border border-red-500/20 animate-shake">
                  <AlertCircle size={16} />
                  <p className="text-[9px] font-black uppercase tracking-widest leading-none">{error}</p>
                </div>
                {!isRegistering && (
                  <button 
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-[10px] font-black text-[#fe7302] hover:text-white transition-colors uppercase tracking-widest text-left ml-4"
                  >
                    {t('forgotPassword')}?
                  </button>
                )}
              </div>
            )}

            {resetSent && (
              <div className="flex items-center gap-3 text-emerald-400 bg-emerald-500/5 p-4 rounded-2xl border border-emerald-500/20 animate-in fade-in zoom-in duration-300">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                <p className="text-[9px] font-black uppercase tracking-widest leading-none">{t('resetEmailSent')}</p>
              </div>
            )}

            <button
              disabled={loading}
              className="group relative w-full overflow-hidden bg-[#fe7302] text-white font-black py-5 rounded-2xl hover:scale-[1.01] active:scale-[0.98] transition-all shadow-[0_20px_40px_rgba(254,115,2,0.2)] uppercase tracking-[0.3em] text-[11px] flex justify-center items-center gap-3 disabled:opacity-50"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
              {loading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>
                  <span>{isRegistering ? t('registerAction') : t('loginAction')}</span>
                  {isRegistering ? <UserPlus size={18} /> : <ArrowRight size={18} />}
                </>
              )}
            </button>

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-white/5"></div>
              <span className="flex-shrink-0 mx-5 text-gray-700 text-[10px] font-black uppercase tracking-[0.3em]">{t('or')}</span>
              <div className="flex-grow border-t border-white/5"></div>
            </div>

            <button
              type="button" onClick={handleGoogleLogin}
              className="w-full bg-white/5 border border-white/10 text-white font-black py-4 rounded-2xl hover:bg-white/10 transition-all uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-4"
            >
              <Image src="https://www.google.com/favicon.ico" alt="Google" width={18} height={18} className="brightness-125" />
              {t('loginWithGoogle')}
            </button>
            
            <div className="text-center pt-2">
              <button
                type="button" onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
                className="text-[11px] font-black text-[#fe7302] hover:text-white transition-colors uppercase tracking-[0.2em]"
              >
                {isRegistering ? t('alreadyHaveAccount') : t('dontHaveAccount')}
              </button>
            </div>
          </form>
        </div>

        <div className="text-center mt-10">
            <button 
                onClick={() => router.push('/')}
                className="text-[9px] font-black text-white/90 uppercase tracking-[0.5em] hover:text-[#fe7302] transition-all flex items-center justify-center gap-6 mx-auto group"
            >
                <div className="w-8 h-[1px] bg-white/10 group-hover:bg-[#fe7302]/30 transition-colors" />
                {t('backToShop')}
                <div className="w-8 h-[1px] bg-white/10 group-hover:bg-[#fe7302]/30 transition-colors" />
            </button>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#050505] flex items-center justify-center"><div className="w-10 h-10 border-2 border-[#fe7302] border-t-transparent rounded-full animate-spin"></div></div>}>
      <LoginPageContent />
    </Suspense>
  );
}