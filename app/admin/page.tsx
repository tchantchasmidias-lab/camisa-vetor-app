'use client';

import { useState, useRef, useEffect } from 'react';
import { db, storage, auth } from '@/lib/firebase';
import { 
  collection, addDoc, serverTimestamp, getDocs, query, orderBy, 
  deleteDoc, doc, updateDoc, setDoc, where, collectionGroup 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { 
  Upload, X, Image as ImageIcon, FileCode, CheckCircle2, 
  Loader2, Plus, Edit3, Trash2, LayoutGrid, Globe, 
  FolderPlus, BarChart3, Users, Award, Megaphone, TrendingUp, Camera, Star
} from 'lucide-react';
import Image from 'next/image';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'produtos' | 'design'>('produtos');
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [metricas, setMetricas] = useState({ clientes: 0, topVendido: 'Nenhum', vendaMensal: 0, topAvaliado: 'Nenhum' });
  const [banner, setBanner] = useState({ imageUrl: '', link: '' });
  
  // ESTADOS DE AUTENTICAÇÃO DO ADMIN
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedFormats, setSelectedFormats] = useState<string[]>([]);
  const [previews, setPreviews] = useState<{ capa?: string; destaque?: string; galeria: string[] }>({ galeria: [] });
  const [showNewCategory, setShowNewCategory] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const [fileCapa, setFileCapa] = useState<File | null>(null);
  const [fileDestaque, setFileDestaque] = useState<File | null>(null);
  const [filesGaleria, setFilesGaleria] = useState<File[]>([]);
  const [fileVetor, setFileVetor] = useState<File | null>(null);

  const formatosDisponiveis = ['CDR', 'PDF', 'SVG', 'PNG', 'AI'];

  // 1. CARREGAR DADOS & CHECAR AUTENTICAÇÃO
  const loadData = async () => {
    try {
      const pSnap = await getDocs(query(collection(db, "products"), orderBy("createdAt", "desc")));
      const pList: any[] = pSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setProducts(pList);

      const cSnap = await getDocs(query(collection(db, "categories"), orderBy("name", "asc")));
      setCategorias(cSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      try {
        const statsRes = await fetch('/api/admin/stats');
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
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email === 'camisavetor@gmail.com') {
        setIsAdmin(true);
        loadData();
      } else {
        setIsAdmin(false);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

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

  // --- MANTÉM AS FUNÇÕES DE PRODUTO (handleSubmitProduct, startEdit, handleImageChange, etc) ---
  // (Omitidas aqui para brevidade, mas devem permanecer no seu arquivo)
  const startEdit = (p: any) => {
    setEditingId(p.id);
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
      let urlCapa = previews.capa, urlDestaque = previews.destaque, urlVetor = products.find(p => p.id === editingId)?.urls?.download, galeriaUrls = previews.galeria.filter(url => !url.startsWith('blob:'));
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8f9fa]">
        <Loader2 className="animate-spin text-[#fe7302] mb-4" size={32} />
        <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-[#5f6368]">Verificando acesso...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 font-sans relative overflow-hidden">
        <div className="max-w-md w-full relative z-10">
          <div className="text-center mb-10">
            <h2 className="text-[14px] font-bold text-white tracking-[0.5em] uppercase mb-2">Painel Administrativo</h2>
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">Acesso Restrito</p>
          </div>
          
          <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            <form onSubmit={handleAdminLogin} className="space-y-6">
              <div>
                <label className="text-[10px] font-bold uppercase text-[#5f6368] ml-2 tracking-widest">E-mail Administrativo</label>
                <input 
                  type="email" required placeholder="admin@..."
                  value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full mt-2 bg-[#f8f9fa] border border-[#dadce0] rounded-2xl p-4 text-[12px] font-medium outline-none focus:border-[#fe7302] transition-all"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-[#5f6368] ml-2 tracking-widest">Senha de Acesso</label>
                <input 
                  type="password" required placeholder="••••••••"
                  value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full mt-2 bg-[#f8f9fa] border border-[#dadce0] rounded-2xl p-4 text-[12px] font-medium outline-none focus:border-[#fe7302] transition-all"
                />
              </div>

              {loginError && <p className="text-red-500 text-[10px] font-bold text-center uppercase">{loginError}</p>}

              <button disabled={isLoggingIn} className="w-full bg-[#fe7302] text-white font-bold py-5 rounded-2xl hover:bg-black transition-all shadow-xl shadow-orange-500/20 uppercase tracking-[0.2em] text-[11px] flex justify-center items-center">
                {isLoggingIn ? <Loader2 size={18} className="animate-spin" /> : 'Acessar Painel'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] pt-16 md:pt-4 pb-20 font-sans text-[#5f6368]">
      <main className="max-w-7xl mx-auto px-4">
        
        {/* MÉTRICAS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-12 animate-in fade-in duration-500">
            <div className="bg-white p-6 rounded-[2rem] border border-[#dadce0] flex items-center gap-4 shadow-sm">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Users size={24}/></div>
                <div><p className="text-[10px] font-bold uppercase text-[#5f6368] tracking-widest mb-1 leading-none">Clientes</p><h3 className="text-xl font-bold text-[#202124]">{metricas.clientes}</h3></div>
            </div>
            <div className="bg-white p-6 rounded-[2rem] border border-[#dadce0] flex items-center gap-4 shadow-sm">
                <div className="p-3 bg-orange-50 text-[#fe7302] rounded-xl"><Award size={24}/></div>
                <div className="flex-1 overflow-hidden"><p className="text-[9px] font-bold uppercase text-[#5f6368] tracking-widest mb-1 leading-none">Top Vendido</p><h3 className="text-[11px] font-bold text-[#202124] uppercase truncate">{metricas.topVendido}</h3></div>
            </div>
            <div className="bg-white p-6 rounded-[1.5rem] border border-[#dadce0] flex items-center gap-4 shadow-sm">
                <div className="p-3 bg-green-50 text-green-600 rounded-xl"><TrendingUp size={24}/></div>
                <div><p className="text-[10px] font-bold uppercase text-[#5f6368] tracking-widest mb-1 leading-none">Venda Mensal</p><h3 className="text-xl font-bold text-[#202124]">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metricas.vendaMensal)}</h3></div>
            </div>
            <div className="bg-white p-6 rounded-[1.5rem] border border-[#dadce0] flex items-center gap-4 shadow-sm">
                <div className="p-3 bg-yellow-50 text-yellow-500 rounded-xl"><Star size={24}/></div>
                <div className="flex-1 overflow-hidden"><p className="text-[10px] font-bold uppercase text-[#5f6368] tracking-widest mb-1 leading-none">Top Avaliado</p><h3 className="text-[11px] font-bold text-[#202124] uppercase truncate">{metricas.topAvaliado}</h3></div>
            </div>
            <div className="bg-white p-6 rounded-[1.5rem] border border-[#dadce0] flex items-center gap-4 shadow-sm">
                <div className="p-3 bg-gray-50 text-green-500 rounded-xl"><BarChart3 size={24}/></div>
                <div><p className="text-[10px] font-bold uppercase text-[#5f6368] tracking-widest mb-1 leading-none">Status</p><h3 className="text-xs font-bold text-green-500 uppercase">Online</h3></div>
            </div>
        </div>

        {/* ABAS E SAÍDA */}
        <div className="flex justify-between items-center mb-10 border-b border-[#dadce0] pb-4">
            <div className="flex gap-4">
                <button onClick={() => setActiveTab('produtos')} className={`px-6 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'produtos' ? 'bg-[#202124] text-white shadow-lg' : 'text-[#5f6368] hover:bg-white'}`}>Produtos</button>
                <button onClick={() => setActiveTab('design')} className={`px-6 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'design' ? 'bg-[#202124] text-white shadow-lg' : 'text-[#5f6368] hover:bg-white'}`}>Design</button>
            </div>
            <button onClick={handleAdminLogout} className="text-[10px] font-bold uppercase tracking-widest text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-full transition-all">Sair do Painel</button>
        </div>

        {/* ABA PRODUTOS (IGUAL ANTERIOR) */}
        {activeTab === 'produtos' && (
           <div className="animate-in fade-in duration-500">
             <form ref={formRef} onSubmit={handleSubmitProduct} className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-20">
               {/* ... seu formulário de produtos completo aqui ... */}
               <div className="lg:col-span-5 space-y-6">
                <div className="bg-white p-6 rounded-[1.5rem] border border-[#dadce0] shadow-sm">
                  <h2 className="text-[11px] font-semibold uppercase text-[#202124] mb-6 flex items-center gap-2"><ImageIcon size={14} className="text-[#fe7302]"/> Arquivos Visuais</h2>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="relative aspect-[4/5] bg-[#f1f3f4] rounded-2xl border-2 border-dashed border-[#dadce0] overflow-hidden flex items-center justify-center hover:border-[#fe7302] transition-all group">
                      {previews.capa ? (
                        <>
                          <img src={previews.capa} alt="" className="w-full h-full object-cover" />
                          <button type="button" onClick={() => removeImage('capa')} className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg z-10"><X size={12}/></button>
                        </>
                      ) : <div className="text-center"><Upload className="mx-auto text-gray-400 mb-1" size={20}/><span className="text-[8px] font-black uppercase text-gray-400">Capa</span></div>}
                      <input type="file" onChange={(e) => handleImageChange(e, 'capa')} className="absolute inset-0 opacity-0 cursor-pointer"/>
                    </div>
                    <div className="relative aspect-[4/5] bg-[#f1f3f4] rounded-2xl border-2 border-dashed border-[#dadce0] overflow-hidden flex items-center justify-center hover:border-[#fe7302] transition-all group">
                      {previews.destaque ? (
                        <>
                          <img src={previews.destaque} alt="" className="w-full h-full object-cover" />
                          <button type="button" onClick={() => removeImage('destaque')} className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg z-10"><X size={12}/></button>
                        </>
                      ) : <div className="text-center"><Upload className="mx-auto text-gray-400 mb-1" size={20}/><span className="text-[8px] font-black uppercase text-gray-400">Destaque</span></div>}
                      <input type="file" onChange={(e) => handleImageChange(e, 'destaque')} className="absolute inset-0 opacity-0 cursor-pointer"/>
                    </div>
                  </div>
                  <div className="space-y-2 mb-6">
                    <label className="text-[10px] font-medium uppercase text-[#5f6368] ml-1">Galeria</label>
                    <div className="grid grid-cols-4 gap-2">
                      {previews.galeria.map((url, i) => (
                        <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-[#dadce0]"><img src={url} alt="" className="w-full h-full object-cover" /></div>
                      ))}
                      <div className="relative aspect-square bg-[#f1f3f4] rounded-xl border-2 border-dashed border-[#dadce0] flex items-center justify-center hover:border-[#fe7302] transition-all">
                        <Plus size={16} className="text-[#5f6368]"/><input type="file" multiple accept="image/*" onChange={(e) => handleImageChange(e, 'galeria')} className="absolute inset-0 opacity-0 cursor-pointer"/>
                      </div>
                    </div>
                  </div>
                  <div className="bg-[#202124] p-5 rounded-2xl text-white flex items-center gap-4 relative">
                    <FileCode size={22} className="text-[#fe7302]" />
                    <div className="flex-1 overflow-hidden"><p className="text-[11px] font-medium truncate">{fileVetor ? fileVetor.name : 'Vetor .CDR / .ZIP'}</p></div>
                    <input type="file" onChange={(e) => setFileVetor(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer z-10"/>
                    <button type="button" className="text-[9px] font-bold uppercase bg-white/10 px-3 py-2 rounded-lg">Trocar</button>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-[1.5rem] border border-[#dadce0] shadow-sm space-y-4">
                  <h2 className="text-[11px] font-semibold uppercase text-[#fe7302] flex items-center gap-2"><Globe size={14}/> SEO & Metadados</h2>
                  <textarea name="seoDescription" rows={3} placeholder="Meta-descrição..." className="w-full bg-[#f8f9fa] border border-[#dadce0] rounded-xl p-3 text-[11px] outline-none focus:border-[#fe7302] resize-none" />
                  <input name="keywords" placeholder="Keywords (vírgulas)" className="w-full bg-[#f8f9fa] border border-[#dadce0] rounded-xl p-3 text-[11px] outline-none focus:border-[#fe7302]" />
                </div>
              </div>
              <div className="lg:col-span-7 bg-white p-8 rounded-[1.5rem] border border-[#dadce0] shadow-sm space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-medium uppercase text-[#5f6368]">Nome do Vetor</label>
                    <input name="productName" required className="w-full bg-[#f8f9fa] border border-[#dadce0] rounded-2xl p-4 text-[12px] font-semibold uppercase outline-none focus:border-[#fe7302]"/>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-medium uppercase text-[#5f6368]">Preço R$</label>
                    <input name="price" required type="number" step="0.01" className="w-full bg-[#f8f9fa] border border-[#dadce0] rounded-2xl p-4 text-[12px] font-semibold outline-none focus:border-[#fe7302]"/>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1"><label className="text-[10px] font-medium uppercase text-[#5f6368]">Categoria</label><button type="button" onClick={() => setShowNewCategory(!showNewCategory)} className="text-[9px] font-bold text-[#fe7302] uppercase flex items-center gap-1"><FolderPlus size={12}/>{showNewCategory ? 'Lista' : 'Nova'}</button></div>
                  {showNewCategory ? <input name="newCategory" placeholder="NOME DA CATEGORIA" className="w-full bg-[#f8f9fa] border border-[#fe7302] rounded-2xl p-4 text-[12px] font-semibold uppercase outline-none"/> :
                  <select name="category" className="w-full bg-[#f8f9fa] border border-[#dadce0] rounded-2xl p-4 text-[12px] font-semibold outline-none cursor-pointer">
                    {categorias.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                  </select>}
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-medium uppercase text-[#5f6368]">Formatos Disponíveis</label>
                  <div className="flex flex-wrap gap-2">
                    {formatosDisponiveis.map(fmt => (
                      <button key={fmt} type="button" onClick={() => setSelectedFormats(prev => prev.includes(fmt) ? prev.filter(f => f !== fmt) : [...prev, fmt])} className={`px-5 py-2.5 rounded-xl text-[10px] font-bold border transition-all ${selectedFormats.includes(fmt) ? 'bg-[#fe7302] text-white border-[#fe7302]' : 'bg-white text-[#5f6368] border-[#dadce0]'}`}>{fmt}</button>
                    ))}
                  </div>
                </div>
                <textarea name="description" rows={5} className="w-full bg-[#f8f9fa] border border-[#dadce0] rounded-2xl p-4 text-[12px] outline-none focus:border-[#fe7302] resize-none"/>
                <button disabled={loading} className="w-full bg-[#fe7302] text-white font-bold py-6 rounded-2xl hover:bg-black transition-all shadow-xl uppercase tracking-widest text-[12px] flex items-center justify-center gap-3">
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18}/>}
                  {editingId ? 'ATUALIZAR VETOR' : 'PUBLICAR VETOR AGORA'}
                </button>
              </div>
             </form>
             {/* LISTA GESTÃO PRODUTOS */}
             <div className="grid grid-cols-1 gap-4">
              {products.map(p => (
                <div key={p.id} className="bg-white p-4 rounded-2xl border border-[#dadce0] flex items-center justify-between group hover:shadow-md transition-all">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-20 relative rounded-xl overflow-hidden bg-[#f1f3f4] border border-[#dadce0]"><img src={p.urls?.capa || ""} alt="" className="w-full h-full object-cover" /></div>
                    <div><h3 className="text-[12px] font-semibold text-[#202124] uppercase tracking-wide">{p.name}</h3><p className="text-[11px] text-[#fe7302] font-bold mt-1">R$ {p.price?.toFixed(2)} • <span className="text-[#5f6368]">{p.category}</span></p></div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(p)} className="p-3 bg-[#f8f9fa] text-[#5f6368] rounded-xl hover:bg-[#202124] hover:text-white transition-all"><Edit3 size={18}/></button>
                    <button onClick={async () => { if(confirm("Excluir?")) { await deleteDoc(doc(db, "products", p.id)); loadData(); } }} className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={18}/></button>
                  </div>
                </div>
              ))}
            </div>
           </div>
        )}

        {/* ABA DESIGN (CATEGORIAS VISUAIS) */}
        {activeTab === 'design' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-500">
             <div className="bg-white p-8 rounded-[2rem] border border-[#dadce0] shadow-sm">
                <h2 className="text-sm font-bold uppercase text-[#202124] mb-6 flex items-center gap-2"><FolderPlus size={18} className="text-[#fe7302]"/> Categorias do Site</h2>
                <form onSubmit={handleAddCategory} className="flex gap-2 mb-6">
                    <input name="catName" placeholder="NOVA CATEGORIA" className="flex-1 bg-[#f1f3f4] border-none rounded-xl px-4 text-xs font-bold uppercase outline-none focus:ring-2 focus:ring-[#fe7302]"/>
                    <button className="bg-[#fe7302] text-white p-3 rounded-xl hover:bg-black transition-all"><Plus/></button>
                </form>
                <div className="space-y-3 max-h-[500px] overflow-y-auto no-scrollbar">
                    {categorias.map(cat => (
                        <div key={cat.id} className="flex justify-between items-center p-3 bg-[#f8f9fa] rounded-2xl border border-[#dadce0] group">
                            <div className="flex items-center gap-4">
                                {/* RETÂNGULO DE UPLOAD DA CATEGORIA */}
                                <div className="relative w-20 h-12 bg-white rounded-xl border-2 border-dashed border-[#dadce0] flex items-center justify-center overflow-hidden hover:border-[#fe7302] transition-all shadow-sm">
                                    {cat.imageUrl ? <img src={cat.imageUrl} alt="" className="w-full h-full object-cover" /> : <Camera size={18} className="text-gray-300" />}
                                    <input 
                                        type="file" 
                                        onChange={(e) => e.target.files?.[0] && handleCategoryImageUpload(e.target.files[0], cat.id)}
                                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                    />
                                </div>
                                <span className="text-[11px] font-bold uppercase text-[#4a4a4a]">{cat.name}</span>
                            </div>
                            <button onClick={async () => { if(confirm("Excluir?")) { await deleteDoc(doc(db, "categories", cat.id)); loadData(); } }} className="text-gray-300 hover:text-red-500 mr-2 transition-colors"><Trash2 size={16}/></button>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white p-8 rounded-[2rem] border border-[#dadce0] shadow-sm">
              <h2 className="text-sm font-bold uppercase text-[#202124] mb-6 flex items-center justify-center gap-2"><Megaphone size={18} className="text-[#fe7302]"/> Banner Sidebar</h2>
              <div className="relative aspect-[4/5] max-w-[240px] mx-auto bg-[#f1f3f4] rounded-2xl border-2 border-dashed border-[#dadce0] overflow-hidden flex items-center justify-center mb-6">
                {banner.imageUrl ? <img src={banner.imageUrl} alt="Banner" className="w-full h-full object-cover" /> : <ImageIcon className="text-gray-300" size={32}/>}
                <input type="file" onChange={(e) => e.target.files?.[0] && handleBannerUpload(e.target.files[0])} className="absolute inset-0 opacity-0 cursor-pointer"/>
              </div>
              <input value={banner.link} onChange={(e) => setBanner(p => ({...p, link: e.target.value}))} onBlur={async () => await setDoc(doc(db, "configuracoes", "sidebar_banner"), { imageUrl: banner.imageUrl, link: banner.link }, { merge: true })} placeholder="Link do Banner (URL)" className="w-full bg-[#f1f3f4] rounded-xl p-4 text-[11px] font-medium outline-none focus:ring-2 focus:ring-[#fe7302]" />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}