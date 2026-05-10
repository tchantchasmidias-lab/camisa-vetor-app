'use client';

import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, updateProfile } from 'firebase/auth';
import { Settings, ChevronLeft, User, Mail, Phone, Lock, Save, ShieldCheck, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useGeo } from '@/lib/i18n/GeoContext';

export default function ConfiguracoesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { t } = useGeo();
  
  // ESTADOS DOS CAMPOS
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [emailValid, setEmailValid] = useState<null | boolean>(true);

  // CARREGA DADOS DO USUÁRIO
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setName(user.displayName || '');
        setEmail(user.email || '');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // MÁSCARA DE TELEFONE
  const handlePhone = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 11) val = val.substring(0, 11);
    let formatted = val;
    if (val.length > 0) formatted = `(${val.substring(0, 2)}`;
    if (val.length > 2) formatted += `) ${val.substring(2, 3)} ${val.substring(3, 7)}`;
    if (val.length > 7) formatted += `-${val.substring(7, 11)}`;
    setPhone(formatted);
  };

  // VALIDAÇÃO DE E-MAIL
  const handleEmail = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEmail(val);
    const emailReg = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
    setEmailValid(val === '' ? null : emailReg.test(val));
  };

  // SALVAR ALTERAÇÕES
  const handleSave = async () => {
    if (!auth.currentUser) return;
    setSaving(true);
    try {
      // Atualiza o Nome no Firebase Auth
      await updateProfile(auth.currentUser, {
        displayName: name
      });
      alert(t('settingsUpdated'));
    } catch (error) {
      console.error(error);
      alert(t('errorSavingChanges'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-[#fe7302] mb-4" size={32} />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">{t('openingPanel')}</p>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen animate-in fade-in duration-500">
      <main className="pt-8 md:pt-12 pb-20 px-4">
        <div className="max-w-3xl mx-auto">
         
          <Link href="/perfil" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 hover:text-[#fe7302] transition-all mb-10 group">
            <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            {t('backToProfile')}
          </Link>

          <div className="mb-12 border-b border-gray-50 pb-8 flex items-center gap-5">
            <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-[#fe7302]">
                <Settings size={24} />
            </div>
            <div>
                <h1 className="text-2xl font-black uppercase tracking-tighter text-gray-900">
                  {t('mySettingsTitle')} <span className="text-[#fe7302]">{t('mySettingsTitleHighlight')}</span>
                </h1>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{t('manageDataSecurity')}</p>
            </div>
          </div>

          <div className="space-y-8">
            {/* SEÇÃO: DADOS PESSOAIS */}
            <section className="bg-[#fbfbfb] p-8 md:p-10 rounded-[2.5rem] border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-10">
                <User size={18} className="text-[#fe7302]" />
                <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-800">{t('profileInfo')}</h2>
              </div>
             
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-2">{t('displayName')}</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                    <input 
                      type="text" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-white border border-gray-100 pl-12 pr-5 py-4 rounded-2xl text-[11px] font-bold uppercase outline-none focus:border-[#fe7302] transition-all" 
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-2">{t('mainEmail')}</label>
                  <div className="relative">
                    <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${emailValid === true ? 'text-green-500' : 'text-gray-300'}`} size={16} />
                    <input
                      type="email"
                      value={email}
                      onChange={handleEmail}
                      disabled 
                      className="w-full bg-gray-50 border border-gray-100 pl-12 pr-12 py-4 rounded-2xl text-[11px] font-bold outline-none opacity-60 cursor-not-allowed"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      {emailValid === true && <CheckCircle2 size={16} className="text-green-500" />}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-2">{t('contactWhatsAppLabel')}</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                    <input
                      type="text"
                      value={phone}
                      onChange={handlePhone}
                      placeholder="(00) 0 0000-0000"
                      className="w-full bg-white border border-gray-100 pl-12 pr-5 py-4 rounded-2xl text-[11px] font-bold outline-none focus:border-[#fe7302] transition-all"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* SEÇÃO: SEGURANÇA */}
            <section className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-gray-100">
              <div className="flex items-center gap-3 mb-10">
                <Lock size={18} className="text-[#fe7302]" />
                <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-800">{t('accountSecurity')}</h2>
              </div>
             
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <p className="md:col-span-2 text-[10px] text-gray-400 font-bold uppercase leading-relaxed mb-4">
                  {t('changePasswordDesc')}
                </p>
                <button className="text-[10px] font-black uppercase tracking-widest text-gray-800 border border-gray-200 py-4 px-6 rounded-2xl hover:bg-gray-50 transition-all">
                    {t('requestNewPassword')}
                </button>
              </div>
            </section>

            {/* FOOTER DE AÇÃO */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 pt-6">
              <div className="flex items-start gap-3 max-w-sm">
                <ShieldCheck size={20} className="text-green-500 mt-1 flex-shrink-0" />
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed">
                  {t('dataProtectionLgpd')}
                </p>
              </div>
             
              <button 
                onClick={handleSave}
                disabled={saving}
                className="w-full md:w-auto bg-[#fe7302] text-white px-12 py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] flex items-center justify-center gap-3 hover:bg-black transition-all shadow-xl shadow-orange-100 active:scale-95 disabled:opacity-50"
              >
                {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                {saving ? t('sending') + '...' : t('saveChanges')}
              </button>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}