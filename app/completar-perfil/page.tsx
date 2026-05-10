'use client';

import { useState, useEffect, Suspense } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Loader2, FileText, Phone, CheckCircle2, AlertCircle } from 'lucide-react';
import { useGeo } from '@/lib/i18n/GeoContext';

function CompletarPerfilContent() {
  const [cpf, setCpf] = useState('');
  const [phone, setPhone] = useState('');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/checkout';
  
  const { t, isInternational, isLoading: loadingGeo } = useGeo();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Se for internacional, não precisa completar CPF/Phone
        if (isInternational && !loadingGeo) {
          router.push(redirectUrl);
          return;
        }

        setUser(currentUser);
        try {
          const userRef = doc(db, 'users', currentUser.uid);
          const snap = await getDoc(userRef);
          if (snap.exists() && snap.data().cpf && snap.data().phone) {
             router.push(redirectUrl);
          } else {
             setLoading(false);
          }
        } catch (err) {
          console.error("Erro ao buscar dados do usuário", err);
          setLoading(false);
        }
      } else {
        router.push('/login');
      }
    });
    return () => unsubscribe();
  }, [router, redirectUrl, isInternational, loadingGeo]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (cpf.length < 14) {
      setError(t('incompleteCpf'));
      return;
    }
    if (phone.length < 15) {
      setError(t('incompleteWhatsapp'));
      return;
    }

    setSaving(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        cpf,
        phone,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      router.push(redirectUrl);
    } catch (err: any) {
      console.error(err);
      setError(t('errorSavingData'));
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-[#050505] flex items-center justify-center"><Loader2 className="animate-spin text-[#fe7302]" size={32} /></div>;
  }

  return (
    <div className="fixed inset-0 z-[110] bg-[#050505] flex items-center justify-center p-4 font-sans overflow-y-auto">
      <div className="max-w-md w-full py-10 relative z-10">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-10">
             <Image src="/logo.svg" alt="Camisa Vetor" width={220} height={55} priority className="h-auto w-auto" />
          </div>
          <h2 className="text-[14px] font-semibold text-white tracking-[0.4em] uppercase">
            {t('completeProfile')}
          </h2>
          <p className="text-[10px] text-gray-400 mt-4 leading-relaxed uppercase tracking-widest max-w-xs mx-auto">
             {t('completeProfileDesc')}
          </p>
        </div>

        <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/5">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-[#5f6368] ml-2 tracking-[0.1em]">{t('cpf')} ({isInternational ? t('requiredForPixInternational') : t('requiredForPix')})</label>
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

            {error && (
              <div className="flex items-center gap-2 text-red-500 bg-red-50 p-4 rounded-xl border border-red-100 animate-in fade-in zoom-in duration-300">
                <AlertCircle size={14} />
                <p className="text-[10px] font-bold uppercase tracking-widest">{error}</p>
              </div>
            )}

            <button
              disabled={saving}
              className="w-full bg-[#fe7302] text-white font-bold py-5 rounded-2xl hover:bg-[#202124] transition-all shadow-lg shadow-orange-500/20 uppercase tracking-[0.2em] text-[11px] flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95"
            >
              {saving ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  <span>{t('saveAndContinue')}</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function CompletarPerfilPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#050505] flex items-center justify-center"><div className="w-10 h-10 border-2 border-[#fe7302] border-t-transparent rounded-full animate-spin"></div></div>}>
      <CompletarPerfilContent />
    </Suspense>
  );
}
