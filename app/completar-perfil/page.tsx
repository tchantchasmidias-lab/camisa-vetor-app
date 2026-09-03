'use client';

import { useState, useEffect, Suspense } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Loader2, FileText, Phone, CheckCircle2, AlertCircle } from 'lucide-react';
import { useGeo } from '@/lib/i18n/GeoContext';
import { formatCPFMask, formatPhoneMask, isValidCPF, cleanPhone } from '@/lib/validationUtils';

function CompletarPerfilContent() {
  const [cpf, setCpf] = useState('');
  const [phone, setPhone] = useState('');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = (searchParams?.get ? searchParams.get('redirect') : null) || '/checkout';
  
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
             if (snap.exists()) {
               if (snap.data().cpf) setCpf(formatCPFMask(snap.data().cpf));
               if (snap.data().phone) setPhone(formatPhoneMask(snap.data().phone));
             }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!isValidCPF(cpf)) {
      setError('CPF inválido. Por favor, verifique os dígitos digitados.');
      return;
    }

    const rawPhone = cleanPhone(phone);
    if (rawPhone.length < 10) {
      setError(t('incompleteWhatsapp'));
      return;
    }

    setSaving(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        cpf: formatCPFMask(cpf),
        phone: formatPhoneMask(phone),
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
                  onChange={(e) => {
                    setCpf(formatCPFMask(e.target.value));
                    if (error) setError('');
                  }}
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
                  onChange={(e) => {
                    setPhone(formatPhoneMask(e.target.value));
                    if (error) setError('');
                  }}
                  className="w-full bg-[#f8f9fa] border border-[#dadce0] rounded-2xl p-4 pl-12 text-[13px] font-medium outline-none focus:border-[#fe7302] focus:bg-white transition-all text-[#202124] placeholder:text-gray-300"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-500 bg-red-50 p-4 rounded-xl border border-red-100 animate-in fade-in zoom-in duration-300">
                <AlertCircle size={14} className="flex-shrink-0" />
                <p className="text-[11px] font-bold leading-tight">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className={`w-full font-bold py-5 rounded-2xl transition-all shadow-xl uppercase text-[11px] tracking-[0.2em] flex items-center justify-center gap-3 ${!saving ? 'bg-[#fe7302] text-white hover:bg-black' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
            >
              {saving ? <Loader2 className="animate-spin" size={16} /> : <><CheckCircle2 size={16} /> {t('continue')}</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function CompletarPerfil() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#050505]" />}>
      <CompletarPerfilContent />
    </Suspense>
  );
}
