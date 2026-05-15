'use client';

import { useState, useRef, useEffect } from 'react';
import { db, storage, auth } from '@/lib/firebase';
import { 
  collection, addDoc, serverTimestamp, getDocs, query, orderBy, 
  deleteDoc, doc, updateDoc, setDoc, where, collectionGroup 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, signInWithRedirect, GoogleAuthProvider, getRedirectResult } from 'firebase/auth';
import { 
  Upload, X, Image as ImageIcon, FileCode, CheckCircle2, 
  Loader2, Plus, Edit3, Trash2, LayoutGrid, Globe, 
  FolderPlus, BarChart3, Users, Award, Megaphone, TrendingUp, Camera, Star, Mail
} from 'lucide-react';
import Image from 'next/image';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'produtos' | 'design' | 'emails'>('produtos');
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [metricas, setMetricas] = useState({ clientes: 0, topVendido: 'Nenhum', vendaMensal: 0, topAvaliado: 'Nenhum' });
  const [banner, setBanner] = useState({ imageUrl: '', link: '' });
  
  // ESTADOS DE EMAIL
  const [emailTemplates, setEmailTemplates] = useState({
    welcomeSubject: '🎉 Bem-vindo à Camisa Vetor!',
    welcomeBody: 'Olá {{nome}}! Seja muito bem-vindo à nossa plataforma. Aqui você encontra os melhores vetores para estamparia.',
    pixSubject: '⏳ Seu pedido está quase lá!',
    pixBody: 'Identificamos o seu pedido. Faça o pagamento para liberar seus arquivos imediatamente.',
  });
  const [isSavingEmails, setIsSavingEmails] = useState(false);
  
  // ESTADOS DE AUTENTICAÇÃO DO ADMIN
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedFormats, setSelectedFormats] = useState<string[]>([]);
  const [previews, setPreviews] = useState<{ capa?: string; destaque?: string; galeria: string[] }>({ galeria: [] });
  const [showNewCategory, setShowNewCategory] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const [fileCapa, setFileCapa] = useState<File | null>(null);
  const [fileDestaque, setFileDestaque] = useState<File | null>(null);
  const [filesGaleria, setFilesGaleria] = useState<File[]>([]);
  const [fileVetor, setFileVetor] = useState<File | null>(null);
  const [removeExistingVetor, setRemoveExistingVetor] = useState(false);

  const formatosDisponiveis = ['CDR', 'PDF', 'SVG', 'PNG', 'AI'];

  useEffect(() => {
    // Só congela a rolagem do body se NÃO for admin (tela de login)
    if (!isAdmin) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isAdmin]);

  // 1. CARREGAR DADOS & CHECAR AUTENTICAÇÃO
  const loadData = async () => {
    try {
      const pSnap = await getDocs(query(collection(db, "products"), orderBy("createdAt", "desc")));
      const pList: any[] = pSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setProducts(pList);

      const cSnap = await getDocs(query(collection(db, "categories"), orderBy("name", "asc")));
      setCategorias(cSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      try {
        const token = await auth.currentUser?.getIdToken();
        const statsRes = await fetch('/api/admin/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (statsRes.ok) {
          const stats = await statsRes.json();
          setMetricas({ 
            clientes: stats.clientes || 0, 
            topVendido: stats.topVendido || 'Nenhum', 
            vendaMensal: stats.vendaMensal || 0, 
            topAvaliado: stats.topAvaliado || 'Nenhum' 
          });
        }
      } catch (err) {
        console.error("Erro ao buscar metricas", err);
      }

      const configSnap = await getDocs(collection(db, "configuracoes"));
      const bData = configSnap.docs.find(d => d.id === 'sidebar_banner')?.data();
      if (bData) setBanner({ imageUrl: bData.imageUrl, link: bData.link });

      const emailData = configSnap.docs.find(d => d.id === 'email_templates')?.data();
      if (emailData) setEmailTemplates(prev => ({ ...prev, ...emailData }));
    } catch (e) { console.error(e); }
  };

  const handleSaveEmails = async () => {
    setIsSavingEmails(true);
    try {
      await setDoc(doc(db, "configuracoes", "email_templates"), emailTemplates, { merge: true });
      alert('Modelos de e-mail salvos com sucesso!');
    } catch (e) {
      console.error(e);
      alert('Erro ao salvar modelos.');
    } finally {
      setIsSavingEmails(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        if (user.email === 'camisavetor@gmail.com') {
          setIsAdmin(true);
          loadData();
        } else {
          setIsAdmin(false);
          setLoginError('Acesso Negado: Esta conta não tem privilégios de administrador.');
          await signOut(auth);
        }
      } else {
        setIsAdmin(false);
      }
      setAuthLoading(false);
    });

    const checkRedirect = async () => {
      try {
        await getRedirectResult(auth);
      } catch (error: any) {
        console.error("Erro no redirecionamento do Google:", error);
        setLoginError('Falha ao autenticar com o Google. Tente novamente.');
      }
    };
    checkRedirect();

    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = () => {
    setIsLoggingIn(true);
    setLoginError('');
    try {
      const provider = new GoogleAuthProvider();
      signInWithRedirect(auth, provider);
    } catch (err) {
      setLoginError('Erro ao iniciar login com Google.');
      setIsLoggingIn(false);
    }
  };

  // LOGIN DO ADMIN
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');
    try {
      if (adminEmail !== 'camisavetor@gmail.com') {
        throw new Error('Acesso não autorizado');
      }
      await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
      // O onAuthStateChanged vai atualizar o estado automaticamente
    } catch (err) {
      setLoginError('Credenciais incorretas ou sem permissão.');
      await signOut(auth); // Garante que desloga se não for o admin
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleAdminLogout = async () => {
    await signOut(auth);
  };

  // 2. FUNÇÕES DE UPLOAD
  const uploadFile = async (file: File, path: string) => {
    const sRef = ref(storage, `${path}/${Date.now()}_${file.name}`);
    await uploadBytes(sRef, file);
    return await getDownloadURL(sRef);
  };

  // UPLOAD DE IMAGEM DA CATEGORIA
  const handleCategoryImageUpload = async (file: File, catId: string) => {
    setLoading(true);
    try {
      const url = await uploadFile(file, 'categories');
      await updateDoc(doc(db, "categories", catId), { imageUrl: url });
      loadData();
      alert("Imagem da categoria atualizada!");
    } catch (e) { alert("Erro ao subir imagem"); }
    setLoading(false);
  };

  const handleAddCategory = async (e: any) => {
    e.preventDefault();
    const name = e.target.catName.value.trim();
    if (!name) return;
    await addDoc(collection(db, "categories"), { name, imageUrl: '', createdAt: serverTimestamp() });
    e.target.reset();
    loadData();
  };

  const handleBannerUpload = async (file: File) => {
    setLoading(true);
    const url = await uploadFile(file, 'config');
    await setDoc(doc(db, "configuracoes", "sidebar_banner"), { imageUrl: url, link: banner.link }, { merge: true });
    setBanner(prev => ({ ...prev, imageUrl: url }));
    setLoading(false);
  };

  const handleGenerateAI = async () => {
    const nameInput = formRef.current?.elements.namedItem('productName') as HTMLInputElement;
    const catSelect = formRef.current?.elements.namedItem('category') as HTMLSelectElement;
    const newCatInput = formRef.current?.elements.namedItem('newCategory') as HTMLInputElement;
    
    const title = nameInput?.value;
    const category = showNewCategory ? newCatInput?.value : catSelect?.value;

    if (!title) {
      alert('Por favor, preencha o título básico primeiro.');
      return;
    }

    setIsGenerating(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/ai/seo', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title, category: category || 'Geral' }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // Atualiza os campos do formulário
      if (nameInput) nameInput.value = data.improvedTitle;
      const descInput = formRef.current?.elements.namedItem('description') as HTMLTextAreaElement;
      if (descInput) descInput.value = data.description;
      const seoDescInput = formRef.current?.elements.namedItem('seoDescription') as HTMLTextAreaElement;
      if (seoDescInput) seoDescInput.value = data.seoDescription;
      const keywordsInput = formRef.current?.elements.namedItem('keywords') as HTMLInputElement;
      if (keywordsInput) keywordsInput.value = data.keywords;

    } catch (err: any) {
      console.error(err);
      alert('Erro ao gerar IA: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // --- MANTÉM AS FUNÇÕES DE PRODUTO (handleSubmitProduct, startEdit, handleImageChange, etc) ---
  // (Omitidas aqui para brevidade, mas devem permanecer no seu arquivo)
  const startEdit = (p: any) => {
    setEditingId(p.id);
    setRemoveExistingVetor(false);
    setFileVetor(null);
    setSelectedFormats(p.formats || []);
    setPreviews({ capa: p.urls?.capa || '', destaque: p.urls?.destaque || '', galeria: p.urls?.galeria || [] });
    if (formRef.current) {
        (formRef.current.elements.namedItem('productName') as HTMLInputElement).value = p.name || '';
        (formRef.current.elements.namedItem('price') as HTMLInputElement).value = p.price || '';
        (formRef.current.elements.namedItem('description') as HTMLTextAreaElement).value = p.description || '';
        const catSelect = formRef.current.elements.namedItem('category') as HTMLSelectElement;
        if (catSelect) catSelect.value = p.category || '';
        (formRef.current.elements.namedItem('seoDescription') as HTMLTextAreaElement).value = p.seoDescription || '';
        (formRef.current.elements.namedItem('keywords') as HTMLInputElement).value = p.keywords || '';
    }
  };

  const createSlug = (text: string) => text.toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-').trim();

  const removeImage = (type: 'capa' | 'destaque' | 'galeria', index?: number) => {
    if (type === 'galeria' && index !== undefined) {
      setPreviews(prev => ({ ...prev, galeria: prev.galeria.filter((_, i) => i !== index) }));
      setFilesGaleria(prev => prev.filter((_, i) => i !== index));
    } else if (type === 'capa') {
      setFileCapa(null);
      setPreviews(prev => ({ ...prev, capa: '' }));
    } else if (type === 'destaque') {
      setFileDestaque(null);
      setPreviews(prev => ({ ...prev, destaque: '' }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'capa' | 'destaque' | 'galeria') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (type === 'galeria') {
      const newFiles = Array.from(files);
      setFilesGaleria(prev => [...prev, ...newFiles]);
      const newUrls = newFiles.map(file => URL.createObjectURL(file));
      setPreviews(prev => ({ ...prev, galeria: [...prev.galeria, ...newUrls] }));
    } else {
      const file = files[0];
      const url = URL.createObjectURL(file);
      if (type === 'capa') { setFileCapa(file); setPreviews(prev => ({ ...prev, capa: url })); }
      if (type === 'destaque') { setFileDestaque(file); setPreviews(prev => ({ ...prev, destaque: url })); }
    }
  };

  const handleSubmitProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const category = showNewCategory ? formData.get('newCategory')?.toString() : formData.get('category')?.toString();
    try {
      let urlCapa = previews.capa, urlDestaque = previews.destaque, urlVetor = removeExistingVetor ? "" : products.find(p => p.id === editingId)?.urls?.download, galeriaUrls = previews.galeria.filter(url => !url.startsWith('blob:'));
      if (fileCapa) urlCapa = await uploadFile(fileCapa, 'capas');
      if (fileDestaque) urlDestaque = await uploadFile(fileDestaque, 'destaques');
      if (fileVetor) urlVetor = await uploadFile(fileVetor, 'downloads');
      if (filesGaleria.length > 0) {
        const novos = await Promise.all(filesGaleria.map(img => uploadFile(img, 'galeria')));
        galeriaUrls = [...galeriaUrls, ...novos];
      }
      const data = {
        name: formData.get('productName')?.toString().toUpperCase(),
        slug: createSlug(formData.get('productName')?.toString() || ''),
        price: Number(formData.get('price')),
        category: category || 'Geral',
        formats: selectedFormats,
        description: formData.get('description'),
        seoDescription: formData.get('seoDescription'),
        keywords: formData.get('keywords'),
        urls: { capa: urlCapa || "", destaque: urlDestaque || "", galeria: galeriaUrls, download: urlVetor || "" },
        updatedAt: serverTimestamp(),
      };
      editingId ? await updateDoc(doc(db, "products", editingId), data) : await addDoc(collection(db, 'products'), { ...data, salesCount: 0, createdAt: serverTimestamp() });
      location.reload();
    } catch (e) { console.error(e); setLoading(false); }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#050505]">
        <Loader2 className="animate-spin text-[#fe7302] mb-4" size={32} />
        <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-gray-500">Verificando acesso...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="fixed inset-0 z-[110] bg-[#050505] flex items-center justify-center p-4 font-sans overflow-x-hidden overflow-y-auto">
        {/* Efeitos de Fundo (Glows Profissionais) */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#fe7302]/10 blur-[150px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#fe7302]/5 blur-[150px] rounded-full"></div>

        <div className="max-w-md w-full relative z-10 animate-in fade-in zoom-in-95 duration-1000">
          {/* LOGO DO SITE */}
          <div className="flex flex-col items-center mb-12">
            <div className="mb-8 hover:scale-105 transition-transform duration-500">
              <Image priority src="/logo.svg" alt="Camisa Vetor" width={220} height={45} className="h-10 w-auto" />
            </div>
            <div className="text-center">
              <h2 className="text-[14px] font-black text-white tracking-[0.6em] uppercase mb-3">Painel Administrativo</h2>
              <div className="flex items-center justify-center gap-3">
                <div className="h-[1px] w-6 bg-gradient-to-r from-transparent to-[#fe7302]/30"></div>
                <p className="text-[9px] font-bold text-[#fe7302] uppercase tracking-[0.4em]">Acesso Restrito</p>
                <div className="h-[1px] w-6 bg-gradient-to-l from-transparent to-[#fe7302]/30"></div>
              </div>
            </div>
          </div>
          
          <div className="bg-[#111111]/80 backdrop-blur-3xl p-8 md:p-12 rounded-[3.5rem] border border-white/5 shadow-[0_50px_100px_rgba(0,0,0,0.9)] relative overflow-hidden">
            {/* Detalhe de borda neon suave */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[40%] h-[2px] bg-gradient-to-r from-transparent via-[#fe7302]/50 to-transparent"></div>

            <form onSubmit={handleAdminLogin} className="space-y-8">
              <div className="space-y-3">
                <label className="text-[9px] font-black uppercase text-gray-500 ml-4 tracking-[0.2em]">E-mail de Acesso</label>
                <div className="relative group">
                  <input 
                    type="email" required placeholder="admin@camisavetor.com"
                    value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-[12px] text-white font-medium outline-none focus:border-[#fe7302]/50 focus:bg-white/[0.08] transition-all placeholder:text-gray-700"
                  />
                  <div className="absolute inset-0 rounded-2xl bg-[#fe7302]/10 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none"></div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[9px] font-black uppercase text-gray-500 ml-4 tracking-[0.2em]">Senha Segura</label>
                <div className="relative group">
                  <input 
                    type="password" required placeholder="••••••••"
                    value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-[12px] text-white font-medium outline-none focus:border-[#fe7302]/50 focus:bg-white/[0.08] transition-all placeholder:text-gray-700"
                  />
                  <div className="absolute inset-0 rounded-2xl bg-[#fe7302]/10 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none"></div>
                </div>
              </div>

              {loginError && (
                <div className="bg-red-500/10 border border-red-500/20 py-4 rounded-2xl animate-shake">
                  <p className="text-red-400 text-[9px] font-black text-center uppercase tracking-widest px-4">{loginError}</p>
                </div>
              )}

              <button 
                disabled={isLoggingIn} 
                className="group relative w-full overflow-hidden bg-[#fe7302] text-white font-black py-6 rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_25px_50px_rgba(254,115,2,0.25)] uppercase tracking-[0.3em] text-[11px] flex justify-center items-center"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                {isLoggingIn ? <Loader2 size={22} className="animate-spin" /> : 'Desbloquear Painel'}
              </button>

              <div className="relative flex items-center pt-2 pb-2">
                <div className="flex-grow border-t border-white/5"></div>
                <span className="flex-shrink-0 mx-5 text-gray-700 text-[10px] font-black uppercase tracking-[0.3em]">OU</span>
                <div className="flex-grow border-t border-white/5"></div>
              </div>

              <button
                type="button" onClick={handleGoogleLogin}
                className="w-full bg-white/5 border border-white/10 text-white font-black py-4 rounded-2xl hover:bg-white/10 transition-all uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-4"
              >
                <Image src="https://www.google.com/favicon.ico" alt="Google" width={18} height={18} className="brightness-125" />
                Entrar com Google
              </button>
            </form>
          </div>

          <div className="mt-16 text-center">
            <p className="text-[8px] font-bold text-gray-700 uppercase tracking-[0.5em] opacity-50">© {new Date().getFullYear()} Camisa Vetor • Acesso Administrativo de Segurança</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] pt-16 md:pt-10 pb-20 font-sans text-gray-400 selection:bg-[#fe7302]/30">
      <main className="max-w-7xl mx-auto px-4">
        
        {/* CABEÇALHO DO PAINEL */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <div>
            <h1 className="text-[20px] font-black text-white uppercase tracking-[0.3em] mb-2">Dashboard</h1>
            <p className="text-[9px] font-bold text-[#fe7302] uppercase tracking-[0.4em]">Gestão de Ativos Digitais</p>
          </div>
          <div className="flex items-center gap-4 bg-[#111111] p-2 rounded-2xl border border-white/5">
             <button onClick={() => setActiveTab('produtos')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'produtos' ? 'bg-[#fe7302] text-white shadow-lg shadow-orange-600/20' : 'text-gray-500 hover:text-white'}`}>Produtos</button>
             <button onClick={() => setActiveTab('design')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'design' ? 'bg-[#fe7302] text-white shadow-lg shadow-orange-600/20' : 'text-gray-500 hover:text-white'}`}>Design</button>
             <button onClick={() => setActiveTab('emails')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'emails' ? 'bg-[#fe7302] text-white shadow-lg shadow-orange-600/20' : 'text-gray-500 hover:text-white'}`}>E-mails</button>
             <div className="w-[1px] h-6 bg-white/10 mx-2"></div>
             <button onClick={handleAdminLogout} className="p-3 text-red-500/50 hover:text-red-500 transition-colors"><X size={20}/></button>
          </div>
        </div>
        
        {/* MÉTRICAS PREMIUM */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <div className="bg-[#111111] p-8 rounded-[2.5rem] border border-white/5 flex items-center gap-6 shadow-2xl group hover:border-[#fe7302]/30 transition-all">
                <div className="p-4 bg-blue-500/10 text-blue-500 rounded-2xl group-hover:scale-110 transition-transform"><Users size={28}/></div>
                <div><p className="text-[9px] font-black uppercase text-gray-500 tracking-widest mb-2">Clientes</p><h3 className="text-2xl font-black text-white tracking-tighter">{metricas.clientes}</h3></div>
            </div>
            <div className="bg-[#111111] p-8 rounded-[2.5rem] border border-white/5 flex items-center gap-6 shadow-2xl group hover:border-[#fe7302]/30 transition-all">
                <div className="p-4 bg-[#fe7302]/10 text-[#fe7302] rounded-2xl group-hover:scale-110 transition-transform"><Award size={28}/></div>
                <div className="flex-1 overflow-hidden"><p className="text-[9px] font-black uppercase text-gray-500 tracking-widest mb-2">Mais Vendido</p><h3 className="text-[12px] font-black text-white uppercase truncate tracking-tight">{metricas.topVendido}</h3></div>
            </div>
            <div className="bg-[#111111] p-8 rounded-[2.5rem] border border-white/5 flex items-center gap-6 shadow-2xl group hover:border-[#fe7302]/30 transition-all">
                <div className="p-4 bg-green-500/10 text-green-500 rounded-2xl group-hover:scale-110 transition-transform"><TrendingUp size={28}/></div>
                <div><p className="text-[9px] font-black uppercase text-gray-500 tracking-widest mb-2">Venda Mensal</p><h3 className="text-xl font-black text-white tracking-tighter">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metricas.vendaMensal)}</h3></div>
            </div>
            <div className="bg-[#111111] p-8 rounded-[2.5rem] border border-white/5 flex items-center gap-6 shadow-2xl group hover:border-[#fe7302]/30 transition-all">
                <div className="p-4 bg-yellow-500/10 text-yellow-500 rounded-2xl group-hover:scale-110 transition-transform"><Star size={28}/></div>
                <div className="flex-1 overflow-hidden"><p className="text-[9px] font-black uppercase text-gray-500 tracking-widest mb-2">Top Avaliado</p><h3 className="text-[12px] font-black text-white uppercase truncate tracking-tight">{metricas.topAvaliado}</h3></div>
            </div>
        </div>

        {/* CONTEÚDO DAS ABAS */}
        <div className="space-y-12">
          {activeTab === 'produtos' && (
            <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
              <div className="flex items-center gap-4 mb-8">
                <div className="h-px flex-1 bg-white/5"></div>
                <h2 className="text-[11px] font-black uppercase text-gray-600 tracking-[0.5em]">Gestão de Inventário</h2>
                <div className="h-px flex-1 bg-white/5"></div>
              </div>

              <form ref={formRef} onSubmit={handleSubmitProduct} className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-24">
                {/* LADO ESQUERDO: ASSETS */}
                <div className="lg:col-span-5 space-y-8">
                  <div className="bg-[#111111] p-8 rounded-[3rem] border border-white/5 shadow-2xl">
                    <h2 className="text-[10px] font-black uppercase text-white mb-8 flex items-center gap-3"><ImageIcon size={16} className="text-[#fe7302]"/> Mídia do Produto</h2>
                    
                    <div className="grid grid-cols-2 gap-6 mb-8">
                      <div className="relative aspect-[4/5] bg-white/[0.03] rounded-3xl border-2 border-dashed border-white/10 overflow-hidden flex items-center justify-center hover:border-[#fe7302]/50 transition-all group">
                        {previews.capa ? (
                          <>
                            <img src={previews.capa} alt="" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button type="button" onClick={() => removeImage('capa')} className="p-3 bg-red-500 text-white rounded-2xl shadow-xl hover:scale-110 transition-transform"><Trash2 size={18}/></button>
                            </div>
                          </>
                        ) : (
                          <div className="text-center">
                            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:bg-[#fe7302]/10 transition-colors">
                              <Upload className="text-gray-500 group-hover:text-[#fe7302]" size={20}/>
                            </div>
                            <span className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Capa Principal</span>
                          </div>
                        )}
                        <input type="file" onChange={(e) => handleImageChange(e, 'capa')} className="absolute inset-0 opacity-0 cursor-pointer"/>
                      </div>

                      <div className="relative aspect-[4/5] bg-white/[0.03] rounded-3xl border-2 border-dashed border-white/10 overflow-hidden flex items-center justify-center hover:border-[#fe7302]/50 transition-all group">
                        {previews.destaque ? (
                          <>
                            <img src={previews.destaque} alt="" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button type="button" onClick={() => removeImage('destaque')} className="p-3 bg-red-500 text-white rounded-2xl shadow-xl hover:scale-110 transition-transform"><Trash2 size={18}/></button>
                            </div>
                          </>
                        ) : (
                          <div className="text-center">
                            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:bg-[#fe7302]/10 transition-colors">
                              <Upload className="text-gray-500 group-hover:text-[#fe7302]" size={20}/>
                            </div>
                            <span className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Banner Detalhe</span>
                          </div>
                        )}
                        <input type="file" onChange={(e) => handleImageChange(e, 'destaque')} className="absolute inset-0 opacity-0 cursor-pointer"/>
                      </div>
                    </div>

                    <div className="space-y-4 mb-8">
                      <div className="flex justify-between items-center px-2">
                        <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Galeria de Fotos</label>
                        <span className="text-[8px] font-bold text-gray-700 bg-white/5 px-2 py-1 rounded-md">{previews.galeria.length} FOTOS</span>
                      </div>
                      <div className="grid grid-cols-4 gap-3">
                        {previews.galeria.map((url, i) => (
                          <div key={i} className="relative aspect-square rounded-2xl overflow-hidden border border-white/5 group">
                            <img src={url} alt="" className="w-full h-full object-cover" />
                            <button type="button" onClick={() => removeImage('galeria', i)} className="absolute inset-0 bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><X size={14}/></button>
                          </div>
                        ))}
                        <div className="relative aspect-square bg-white/[0.03] rounded-2xl border-2 border-dashed border-white/10 flex items-center justify-center hover:border-[#fe7302]/50 transition-all">
                          <Plus size={20} className="text-gray-600"/><input type="file" multiple accept="image/*" onChange={(e) => handleImageChange(e, 'galeria')} className="absolute inset-0 opacity-0 cursor-pointer"/>
                        </div>
                      </div>
                    </div>

                    {(() => {
                      const existingVetorUrl = editingId ? products.find(p => p.id === editingId)?.urls?.download : null;
                      const hasVetor = fileVetor || (existingVetorUrl && !removeExistingVetor);
                      const displayTitle = fileVetor ? fileVetor.name : (hasVetor ? 'Arquivo Atual Mantido' : 'Vetor Digital');
                      const displaySub = hasVetor ? 'Pronto para uso' : 'Selecione .CDR, .ZIP ou .PDF';

                      return (
                        <div className={`p-6 rounded-[2rem] border relative group transition-all ${hasVetor ? 'bg-green-500/5 border-green-500/20' : 'bg-white/5 border-white/10 hover:bg-white/[0.08]'}`}>
                          <div className="flex items-center gap-5">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${hasVetor ? 'bg-green-500/10 text-green-500' : 'bg-[#fe7302]/10 text-[#fe7302]'}`}>
                              {hasVetor ? <CheckCircle2 size={28} /> : <FileCode size={28} />}
                            </div>
                            <div className="flex-1 overflow-hidden">
                              <p className="text-[11px] font-bold text-white truncate mb-1">{displayTitle}</p>
                              <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">{displaySub}</p>
                            </div>
                            {hasVetor && (
                              <button 
                                type="button" 
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setFileVetor(null);
                                  if (existingVetorUrl) setRemoveExistingVetor(true);
                                }}
                                className="w-10 h-10 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all z-20 relative"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                          {!hasVetor && (
                            <input type="file" onChange={(e) => { setFileVetor(e.target.files?.[0] || null); setRemoveExistingVetor(false); }} className="absolute inset-0 opacity-0 cursor-pointer z-10"/>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  <div className="bg-[#111111] p-8 rounded-[3rem] border border-white/5 shadow-2xl space-y-6">
                    <h2 className="text-[10px] font-black uppercase text-[#fe7302] flex items-center gap-3 tracking-[0.2em]"><Globe size={16}/> Inteligência de SEO</h2>
                    <div className="space-y-4">
                      <textarea name="seoDescription" rows={3} placeholder="Descrição para o Google..." className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-[11px] text-white outline-none focus:border-[#fe7302]/50 transition-all resize-none placeholder:text-gray-700" />
                      <input name="keywords" placeholder="Palavras-chave (separadas por vírgula)" className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-[11px] text-white outline-none focus:border-[#fe7302]/50 transition-all placeholder:text-gray-700" />
                    </div>
                  </div>
                </div>

                {/* LADO DIREITO: INFOS */}
                <div className="lg:col-span-7 bg-[#111111] p-10 rounded-[4rem] border border-white/5 shadow-2xl space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 space-y-4">
                      <div className="flex justify-between items-center px-4">
                        <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Identificação do Vetor</label>
                        <button 
                          type="button" 
                          onClick={handleGenerateAI}
                          disabled={isGenerating}
                          className="bg-[#fe7302]/10 hover:bg-[#fe7302] text-[#fe7302] hover:text-white text-[8px] font-black px-4 py-2 rounded-full border border-[#fe7302]/20 transition-all flex items-center gap-2 shadow-lg shadow-orange-600/5 disabled:opacity-50"
                        >
                          {isGenerating ? <Loader2 size={12} className="animate-spin"/> : <Star size={12} className="animate-pulse"/>}
                          {isGenerating ? 'GERANDO SEO...' : 'GERAR SEO IA'}
                        </button>
                      </div>
                      <input name="productName" required placeholder="EX: CAMISA NONO ANO FOGUETE" className="w-full bg-white/5 border border-white/10 rounded-[2rem] p-6 text-[14px] font-black text-white uppercase outline-none focus:border-[#fe7302]/50 focus:bg-white/[0.08] transition-all"/>
                    </div>
                    <div className="space-y-4">
                      <label className="text-[9px] font-black uppercase text-gray-500 ml-4 tracking-widest">Preço de Venda</label>
                      <div className="relative">
                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-[#fe7302] font-black text-[12px]">R$</span>
                        <input name="price" required type="number" step="0.01" placeholder="0,00" className="w-full bg-white/5 border border-white/10 rounded-[2rem] p-6 pl-14 text-[16px] font-black text-white outline-none focus:border-[#fe7302]/50 transition-all"/>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center px-4">
                       <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Categorização</label>
                       <button type="button" onClick={() => setShowNewCategory(!showNewCategory)} className="text-[8px] font-black text-[#fe7302] uppercase flex items-center gap-2 hover:scale-105 transition-transform"><FolderPlus size={14}/>{showNewCategory ? 'Voltar para Lista' : 'Nova Categoria'}</button>
                    </div>
                    {showNewCategory ? (
                      <input name="newCategory" placeholder="DIGITE O NOME DA NOVA CATEGORIA" className="w-full bg-white/5 border border-[#fe7302]/30 rounded-[2rem] p-6 text-[12px] font-black text-white uppercase outline-none shadow-[0_0_20px_rgba(254,115,2,0.05)]"/>
                    ) : (
                      <select name="category" className="w-full bg-white/5 border border-white/10 rounded-[2rem] p-6 text-[12px] font-black text-white uppercase outline-none cursor-pointer hover:bg-white/[0.08] transition-all appearance-none">
                        {categorias.map(cat => <option key={cat.id} value={cat.name} className="bg-[#111111]">{cat.name}</option>)}
                      </select>
                    )}
                  </div>

                  <div className="space-y-5">
                    <label className="text-[9px] font-black uppercase text-gray-500 ml-4 tracking-widest">Formatos Inclusos no Download</label>
                    <div className="flex flex-wrap gap-3">
                      {formatosDisponiveis.map(fmt => (
                        <button 
                          key={fmt} type="button" 
                          onClick={() => setSelectedFormats(prev => prev.includes(fmt) ? prev.filter(f => f !== fmt) : [...prev, fmt])} 
                          className={`px-8 py-4 rounded-2xl text-[10px] font-black border transition-all ${selectedFormats.includes(fmt) ? 'bg-[#fe7302] text-white border-[#fe7302] shadow-lg shadow-orange-600/20' : 'bg-white/5 text-gray-500 border-white/5 hover:border-white/10'}`}
                        >
                          {fmt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[9px] font-black uppercase text-gray-500 ml-4 tracking-widest">Descrição Técnica & Argumentos</label>
                    <textarea name="description" rows={6} placeholder="Descreva os detalhes desta arte..." className="w-full bg-white/5 border border-white/10 rounded-[2.5rem] p-8 text-[12px] text-gray-300 outline-none focus:border-[#fe7302]/50 focus:bg-white/[0.08] transition-all resize-none placeholder:text-gray-700"/>
                  </div>

                  <button disabled={loading} className="group relative w-full bg-[#fe7302] text-white font-black py-8 rounded-[2.5rem] hover:bg-white hover:text-[#fe7302] transition-all shadow-[0_20px_50px_rgba(254,115,2,0.15)] uppercase tracking-[0.4em] text-[13px] flex items-center justify-center gap-4 overflow-hidden">
                    <div className="absolute inset-0 bg-white translate-y-[100%] group-hover:translate-y-0 transition-transform duration-500"></div>
                    <div className="relative z-10 flex items-center gap-4">
                      {loading ? <Loader2 size={24} className="animate-spin" /> : <CheckCircle2 size={24}/>}
                      {editingId ? 'SALVAR ALTERAÇÕES' : 'PUBLICAR VETOR AGORA'}
                    </div>
                  </button>
                </div>
              </form>

              {/* LISTAGEM DE GESTÃO */}
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <h2 className="text-[11px] font-black uppercase text-gray-600 tracking-[0.5em]">Produtos Cadastrados</h2>
                  <div className="h-px flex-1 bg-white/5"></div>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  {products.map(p => (
                    <div key={p.id} className="bg-[#111111] p-5 rounded-[2.5rem] border border-white/5 flex items-center justify-between group hover:border-[#fe7302]/40 transition-all shadow-xl">
                      <div className="flex items-center gap-8">
                        <div className="w-20 h-24 relative rounded-2xl overflow-hidden bg-black/40 border border-white/5 shadow-inner">
                          <img src={p.urls?.capa || ""} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                        </div>
                        <div>
                          <h3 className="text-[14px] font-black text-white uppercase tracking-tight mb-2">{p.name}</h3>
                          <div className="flex items-center gap-3">
                            <span className="text-[12px] text-[#fe7302] font-black">R$ {p.price?.toFixed(2)}</span>
                            <span className="text-gray-800">•</span>
                            <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full">{p.category}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-3 pr-4">
                        <button onClick={() => startEdit(p)} className="p-4 bg-white/5 text-gray-500 rounded-2xl hover:bg-[#fe7302] hover:text-white transition-all"><Edit3 size={20}/></button>
                        <button onClick={async () => { if(confirm("Excluir definitivamente?")) { await deleteDoc(doc(db, "products", p.id)); loadData(); } }} className="p-4 bg-white/5 text-gray-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={20}/></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ABA DESIGN (CATEGORIAS) */}
          {activeTab === 'design' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
               <div className="bg-[#111111] p-10 rounded-[3rem] border border-white/5 shadow-2xl">
                  <div className="flex items-center justify-between mb-10">
                    <h2 className="text-[12px] font-black uppercase text-white flex items-center gap-4 tracking-widest"><FolderPlus size={20} className="text-[#fe7302]"/> Categorias</h2>
                    <span className="text-[9px] font-bold text-gray-600 uppercase bg-white/5 px-3 py-1 rounded-full">{categorias.length} ATIVAS</span>
                  </div>

                  <form onSubmit={handleAddCategory} className="flex gap-3 mb-10">
                      <input name="catName" placeholder="NOME DA CATEGORIA" className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-[11px] font-black uppercase text-white outline-none focus:border-[#fe7302]/50 transition-all"/>
                      <button className="bg-[#fe7302] text-white p-4 rounded-2xl hover:scale-105 transition-all shadow-lg shadow-orange-600/20"><Plus/></button>
                  </form>

                  <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                      {categorias.map(cat => (
                          <div key={cat.id} className="flex justify-between items-center p-4 bg-white/[0.02] rounded-[2rem] border border-white/5 group hover:bg-white/[0.05] transition-all">
                              <div className="flex items-center gap-6">
                                  <div className="relative w-24 h-14 bg-black/40 rounded-2xl border border-white/5 flex items-center justify-center overflow-hidden group-hover:border-[#fe7302]/50 transition-all shadow-inner">
                                      {cat.imageUrl ? <img src={cat.imageUrl} alt="" className="w-full h-full object-cover" /> : <Camera size={20} className="text-gray-700" />}
                                      <input 
                                          type="file" 
                                          onChange={(e) => e.target.files?.[0] && handleCategoryImageUpload(e.target.files[0], cat.id)}
                                          className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                      />
                                  </div>
                                  <span className="text-[11px] font-black uppercase text-gray-400 tracking-tight">{cat.name}</span>
                              </div>
                              <button onClick={async () => { if(confirm("Remover esta categoria?")) { await deleteDoc(doc(db, "categories", cat.id)); loadData(); } }} className="p-3 text-gray-700 hover:text-red-500 transition-colors"><Trash2 size={18}/></button>
                          </div>
                      ))}
                  </div>
              </div>

              <div className="space-y-10">
                <div className="bg-[#111111] p-10 rounded-[3rem] border border-white/5 shadow-2xl">
                  <h2 className="text-[12px] font-black uppercase text-white mb-10 flex items-center gap-4 tracking-widest"><Megaphone size={20} className="text-[#fe7302]"/> Banner Publicitário</h2>
                  <div className="relative aspect-[4/5] max-w-[280px] mx-auto bg-black/40 rounded-[2.5rem] border-2 border-dashed border-white/5 overflow-hidden flex items-center justify-center mb-10 group hover:border-[#fe7302]/30 transition-all">
                    {banner.imageUrl ? <img src={banner.imageUrl} alt="Banner" className="w-full h-full object-cover" /> : <ImageIcon className="text-gray-700" size={40}/>}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                       <span className="text-[9px] font-black text-white uppercase tracking-[0.3em] bg-black/40 px-4 py-2 rounded-full backdrop-blur-md">Trocar Imagem</span>
                    </div>
                    <input type="file" onChange={(e) => e.target.files?.[0] && handleBannerUpload(e.target.files[0])} className="absolute inset-0 opacity-0 cursor-pointer"/>
                  </div>
                  <div className="space-y-4">
                    <label className="text-[9px] font-black uppercase text-gray-500 ml-4 tracking-widest">Link de Destino (URL)</label>
                    <input 
                      value={banner.link} 
                      onChange={(e) => setBanner(p => ({...p, link: e.target.value}))} 
                      onBlur={async () => await setDoc(doc(db, "configuracoes", "sidebar_banner"), { imageUrl: banner.imageUrl, link: banner.link }, { merge: true })} 
                      placeholder="https://..." 
                      className="w-full bg-white/5 border border-white/10 rounded-[1.5rem] p-5 text-[11px] text-white outline-none focus:border-[#fe7302]/50 transition-all placeholder:text-gray-700" 
                    />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-[#fe7302]/10 to-transparent p-10 rounded-[3rem] border border-[#fe7302]/10 shadow-2xl">
                  <h3 className="text-white font-black uppercase text-[12px] mb-4 tracking-widest">Dica Premium</h3>
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    Sempre use imagens de capa com **fundo limpo** e em formato **4:5** para manter a elegância da vitrine. Vetores bem descritos e com palavras-chave corretas vendem até **3x mais** através do Google.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'emails' && (
            <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
              <div className="flex items-center gap-4 mb-8">
                <div className="h-px flex-1 bg-white/5"></div>
                <h2 className="text-[11px] font-black uppercase text-gray-600 tracking-[0.5em]">Gerenciador de E-mails</h2>
                <div className="h-px flex-1 bg-white/5"></div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-24">
                {/* E-MAIL BOAS VINDAS */}
                <div className="bg-[#111111] p-10 rounded-[3rem] border border-white/5 shadow-2xl space-y-6">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                      <Mail size={24} />
                    </div>
                    <div>
                      <h3 className="text-[14px] font-black text-white uppercase tracking-widest">Boas-Vindas</h3>
                      <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Novo Cliente Cadastrado</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[9px] font-black uppercase text-gray-500 ml-4 tracking-widest">Assunto do E-mail</label>
                    <input 
                      value={emailTemplates.welcomeSubject}
                      onChange={e => setEmailTemplates(p => ({...p, welcomeSubject: e.target.value}))}
                      className="w-full bg-white/5 border border-white/10 rounded-[1.5rem] p-5 text-[12px] text-white outline-none focus:border-[#fe7302]/50 transition-all" 
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="text-[9px] font-black uppercase text-gray-500 ml-4 tracking-widest">Corpo da Mensagem (Suporta variáveis)</label>
                    <textarea 
                      value={emailTemplates.welcomeBody}
                      onChange={e => setEmailTemplates(p => ({...p, welcomeBody: e.target.value}))}
                      className="w-full h-40 bg-white/5 border border-white/10 rounded-[1.5rem] p-5 text-[12px] text-white outline-none focus:border-[#fe7302]/50 transition-all resize-none" 
                    ></textarea>
                    <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest ml-4">Use {'{{nome}}'} para incluir o nome do cliente.</p>
                  </div>
                </div>

                {/* E-MAIL PIX */}
                <div className="bg-[#111111] p-10 rounded-[3rem] border border-white/5 shadow-2xl space-y-6">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-[#fe7302] flex items-center justify-center">
                      <Mail size={24} />
                    </div>
                    <div>
                      <h3 className="text-[14px] font-black text-white uppercase tracking-widest">Aguardando Pagamento</h3>
                      <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Pedido Pix ou Boleto Gerado</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[9px] font-black uppercase text-gray-500 ml-4 tracking-widest">Assunto do E-mail</label>
                    <input 
                      value={emailTemplates.pixSubject}
                      onChange={e => setEmailTemplates(p => ({...p, pixSubject: e.target.value}))}
                      className="w-full bg-white/5 border border-white/10 rounded-[1.5rem] p-5 text-[12px] text-white outline-none focus:border-[#fe7302]/50 transition-all" 
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="text-[9px] font-black uppercase text-gray-500 ml-4 tracking-widest">Corpo da Mensagem</label>
                    <textarea 
                      value={emailTemplates.pixBody}
                      onChange={e => setEmailTemplates(p => ({...p, pixBody: e.target.value}))}
                      className="w-full h-40 bg-white/5 border border-white/10 rounded-[1.5rem] p-5 text-[12px] text-white outline-none focus:border-[#fe7302]/50 transition-all resize-none" 
                    ></textarea>
                  </div>
                </div>

                {/* BOTÃO SALVAR GERAL */}
                <div className="lg:col-span-2 flex justify-end">
                  <button 
                    onClick={handleSaveEmails}
                    disabled={isSavingEmails}
                    className="bg-[#fe7302] text-white px-10 py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-orange-900/50 hover:bg-[#ff8a2b] transition-all flex items-center gap-3 disabled:opacity-50"
                  >
                    {isSavingEmails ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                    Salvar Modelos de E-mail
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
