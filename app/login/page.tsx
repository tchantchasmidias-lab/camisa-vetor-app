'use client';

import { useState, Suspense } from 'react';
import { auth, db } from '@/lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Mail, Lock, Loader2, ArrowRight, AlertCircle, UserPlus, User, FileText, Phone, Eye, EyeOff } from 'lucide-react';
import { useGeo } from '@/lib/i18n/GeoContext';

export function LoginPageContent() {
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
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/perfil';

  const { t, isInternational } = useGeo();

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

  return (
    <div className="fixed inset-0 z-[110] bg-[#050505] flex items-center justify-center p-4 font-sans overflow-y-auto">
      <div className="max-w-md w-full pt-12 pb-12 relative z-10">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-12">
             <Image 
                src="/logo.svg" 
                alt="Camisa Vetor" 
                width={135} 
                height={35} 
                priority 
                className="object-contain" 
             />
          </div>
          <h2 className="text-[15px] font-bold text-white tracking-[0.3em] uppercase opacity-90">
            {isRegistering ? t('createAccount') : t('clientAccess')}
          </h2>
        </div>

        <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/5">
          <form onSubmit={handleAuth} className="space-y-6">
            
            {isRegistering && (
              <>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-[#5f6368] ml-2 tracking-[0.1em]">{t('fullName')}</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#dadce0]" size={18} />
                    <input 
                      type="text" 
                      required
                      placeholder={t('fullName')}
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      className="w-full bg-[#f8f9fa] border border-[#dadce0] rounded-2xl p-4 pl-12 text-[13px] font-medium outline-none focus:border-[#fe7302] focus:bg-white transition-all text-[#202124] placeholder:text-gray-300"
                    />
                  </div>
                </div>

                {!isInternational && (
                  <>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-[#5f6368] ml-2 tracking-[0.1em]">{t('cpf')}</label>
                      <div className="relative">
                        <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-[#dadce0]" size={18} />
                        <input 
                          type="text" 
                          required
                          placeholder="000.000.000-00"
                          value={cpf}
                          onChange={(e) => setCpf(maskCPF(e.target.value))}
                          className="w-full bg-[#f8f9fa] border border-[#dadce0] rounded-2xl p-4 pl-12 text-[13px] font-medium outline-none focus:border-[#fe7302] focus:bg-white transition-all text-[#202124] placeholder:text-gray-300"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-[#5f6368] ml-2 tracking-[0.1em]">{t('whatsapp')}</label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-[#dadce0]" size={18} />
                        <input 
                          type="text" 
                          required
                          placeholder="(00) 00000-0000"
                          value={phone}
                          onChange={(e) => setPhone(maskPhone(e.target.value))}
                          className="w-full bg-[#f8f9fa] border border-[#dadce0] rounded-2xl p-4 pl-12 text-[13px] font-medium outline-none focus:border-[#fe7302] focus:bg-white transition-all text-[#202124] placeholder:text-gray-300"
                        />
                      </div>
                    </div>
                  </>
                )}
              </>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-[#5f6368] ml-2 tracking-[0.1em]">{t('email')}</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#dadce0]" size={18} />
                <input 
                  type="email" 
                  required
                  placeholder={t('email')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#f8f9fa] border border-[#dadce0] rounded-2xl p-4 pl-12 text-[13px] font-medium outline-none focus:border-[#fe7302] focus:bg-white transition-all text-[#202124] placeholder:text-gray-300"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-[#5f6368] ml-2 tracking-[0.1em]">{t('password')}</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#dadce0]" size={18} />
                <input 
                  type={showPassword ? "text" : "password"} 
                  required
                  placeholder={t('password')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  className="w-full bg-[#f8f9fa] border border-[#dadce0] rounded-2xl p-4 pl-12 pr-12 text-[13px] font-medium outline-none focus:border-[#fe7302] focus:bg-white transition-all text-[#202124] placeholder:text-gray-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#dadce0] hover:text-[#fe7302] transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {isRegistering && (
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-[#5f6368] ml-2 tracking-[0.1em]">{t('confirmPassword')}</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#dadce0]" size={18} />
                  <input 
                    type={showConfirmPassword ? "text" : "password"} 
                    required
                    placeholder={t('confirmPassword')}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    minLength={6}
                    className="w-full bg-[#f8f9fa] border border-[#dadce0] rounded-2xl p-4 pl-12 pr-12 text-[13px] font-medium outline-none focus:border-[#fe7302] focus:bg-white transition-all text-[#202124] placeholder:text-gray-300"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#dadce0] hover:text-[#fe7302] transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 text-red-500 bg-red-50 p-4 rounded-xl border border-red-100 animate-in fade-in zoom-in duration-300">
                <AlertCircle size={14} />
                <p className="text-[10px] font-bold uppercase tracking-widest">{error}</p>
              </div>
            )}

            <button
              disabled={loading}
              className="w-full bg-[#fe7302] text-white font-bold py-5 rounded-2xl hover:bg-[#202124] transition-all shadow-lg shadow-orange-500/20 uppercase tracking-[0.2em] text-[11px] flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  <span>{isRegistering ? t('registerAction') : t('loginAction')}</span>
                  {isRegistering ? <UserPlus size={16} /> : <ArrowRight size={16} />}
                </>
              )}
            </button>

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-[#dadce0]"></div>
              <span className="flex-shrink-0 mx-4 text-[#dadce0] text-[10px] font-bold uppercase tracking-widest">{t('or')}</span>
              <div className="flex-grow border-t border-[#dadce0]"></div>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full bg-white border border-[#dadce0] text-[#202124] font-bold py-4 rounded-2xl hover:bg-gray-50 transition-all uppercase tracking-[0.1em] text-[11px] flex items-center justify-center gap-3"
            >
              <Image src="https://www.google.com/favicon.ico" alt="Google" width={16} height={16} />
              {t('loginWithGoogle')}
            </button>
            
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsRegistering(!isRegistering);
                  setError('');
                }}
                className="text-[13px] md:text-[14px] font-bold text-[#5f6368] hover:text-[#fe7302] transition-colors uppercase tracking-[0.1em]"
              >
                {isRegistering ? t('alreadyHaveAccount') : t('dontHaveAccount')}
              </button>
            </div>
          </form>
        </div>

        <div className="text-center mt-12">
            <button 
                onClick={() => router.push('/')}
                className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.4em] hover:text-[#fe7302] transition-all flex items-center justify-center gap-4 mx-auto"
            >
                <div className="w-6 h-[1px] bg-gray-800" />
                {t('backToShop')}
                <div className="w-6 h-[1px] bg-gray-800" />
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