'use client';

import { useState, useRef, useEffect } from 'react';
import { db, storage, auth } from '@/lib/firebase';
import BlogTab from './BlogTab';
import { 
  collection, addDoc, serverTimestamp, getDocs, query, orderBy, 
  deleteDoc, doc, updateDoc, setDoc, where, collectionGroup 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { 
  Upload, X, Image as ImageIcon, FileCode, CheckCircle2, 
  Loader2, Plus, Edit3, Trash2, LayoutGrid, Globe, 
  FolderPlus, BarChart3, Users, Award, Megaphone, TrendingUp, Camera, Star, Mail, Package, Tag, Clock, Search, Calendar
} from 'lucide-react';
import Image from 'next/image';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'produtos' | 'design' | 'emails' | 'pedidos' | 'clientes' | 'blog'>('produtos');
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [buscaProduto, setBuscaProduto] = useState('');
  const [paginaAtual, setPaginaAtual] = useState(1);
  const ITENS_POR_PAGINA = 10;
  const [categorias, setCategorias] = useState<any[]>([]);
  const [cupons, setCupons] = useState<any[]>([]);
  const [novoCupom, setNovoCupom] = useState({ code: '', type: 'percent', value: '', minOrder: '', expiresAt: '' });
  const [metricas, setMetricas] = useState({ clientes: 0, topVendido: 'Nenhum', vendaMensal: 0, topAvaliado: 'Nenhum' });
  const [banner, setBanner] = useState({ imageUrl: '', link: '' });
  const [lastPublishedProduct, setLastPublishedProduct] = useState<{ name: string; slug: string } | null>(null);
  const [isSendingPush, setIsSendingPush] = useState(false);
  
  // ESTADOS DE PEDIDOS
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'pago' | 'pendente' | 'cancelado'>('todos');
  const [buscaPedido, setBuscaPedido] = useState('');

  // ESTADOS DE CLIENTES
  const [listaClientes, setListaClientes] = useState<any[]>([]);
  const [buscaCliente, setBuscaCliente] = useState('');
  
  // ESTADOS DE EMAIL
  const [emailTemplates, setEmailTemplates] = useState({
    welcomeSubject: '🎉 Bem-vindo à Camisa Vetor!',
    welcomeBody: 'Olá {{nome}}! Seja muito bem-vindo à nossa plataforma. Aqui você encontra os melhores vetores para estamparia.',
    pixSubject: '⏳ Seu pedido está quase lá!',
    pixBody: 'Identificamos o seu pedido. Faça o pagamento para liberar seus arquivos imediatamente.',
    deliverySubject: '🚀 Seus vetores chegaram!',
    deliveryBody: 'Olá {{nome}}, muito obrigado pela compra. Seguem abaixo os links para baixar seus arquivos.\n\n{{links}}',
    marketingSubject: '🔥 Novidade na Camisa Vetor!',
    marketingBody: 'Olá {{nome}}, temos pacotes novos disponíveis com desconto especial para você.',
    marketingImageUrl: '',
    marketingButtonText: 'Aproveitar Agora',
    marketingButtonLink: 'https://camisavetor.com',
  });
  const [isSavingEmails, setIsSavingEmails] = useState(false);
  const [isSendingMarketing, setIsSendingMarketing] = useState(false);
  const [isTestingEmail, setIsTestingEmail] = useState<Record<string, boolean>>({});
  
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

        // Carregar cupons via API (Admin SDK — ignora regras Firestore)
        const cupRes = await fetch('/api/coupons/manage', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (cupRes.ok) {
          const cupData = await cupRes.json();
          setCupons(cupData.coupons || []);
        }

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

      // Buscar Pedidos
      try {
        const token = await auth.currentUser?.getIdToken();
        const pedRes = await fetch('/api/admin/pedidos', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (pedRes.ok) {
          const pedData = await pedRes.json();
          const pedList = pedData.pedidos || [];
          pedList.sort((a: any, b: any) => {
            const dateA = new Date(a.createdAt || 0);
            const dateB = new Date(b.createdAt || 0);
            return dateB.getTime() - dateA.getTime();
          });
          setPedidos(pedList);
        }
      } catch (err) {
        console.error("Erro ao buscar pedidos", err);
      }

      // Buscar Clientes
      try {
        const token = await auth.currentUser?.getIdToken();
        const clientesRes = await fetch('/api/admin/clientes', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (clientesRes.ok) {
          const clientesData = await clientesRes.json();
          setListaClientes(clientesData.clientes || []);
        }
      } catch (err) {
        console.error("Erro ao buscar clientes", err);
      }
    } catch (e) { console.error(e); }
  };

  const handleDeleteCliente = async (uid: string, nome: string) => {
    if (!confirm(`Tem certeza que deseja deletar o cliente "${nome}"? Esta ação não pode ser desfeita.`)) return;
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/admin/clientes', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ uid }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setListaClientes(prev => prev.filter(c => c.uid !== uid));
      setMetricas(prev => ({ ...prev, clientes: prev.clientes - 1 }));
      alert(`Cliente "${nome}" deletado com sucesso.`);
    } catch (error: any) {
      alert('Erro ao deletar cliente: ' + error.message);
    }
  };

  // Conta pedidos pagos de um cliente
  const getComprasCliente = (uid: string): number => {
    return pedidos.filter(p => p.userId === uid && p.status === 'pago').length;
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: 'pago' | 'pendente' | 'cancelado') => {
    try {
      // Busca o pedido para obter o userId antes de atualizar
      const pedido = pedidos.find(p => p.id === orderId);
      
      await updateDoc(doc(db, "pedidos", orderId), { status: newStatus });
      setPedidos(prev => prev.map(p => p.id === orderId ? { ...p, status: newStatus } : p));
      alert(`Status do pedido atualizado para '${newStatus}' com sucesso!`);

      // Envia notificação push se o status mudou para 'pago'
      if (newStatus === 'pago' && pedido?.userId) {
        try {
          const token = await auth.currentUser?.getIdToken();
          await fetch('/api/notifications/order-approved', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ userId: pedido.userId, orderId }),
          });
          console.log('[Admin] Notificação de pedido aprovado enviada.');
        } catch (notifErr) {
          // Falha na notificação não bloqueia a atualização do status
          console.error('[Admin] Erro ao enviar notificação:', notifErr);
        }
      }
    } catch (error: any) {
      console.error("Erro ao atualizar status do pedido:", error);
      alert("Erro ao atualizar status: " + error.message);
    }
  };

  const handleSaveEmails = async () => {
    setIsSavingEmails(true);
    try {
      await setDoc(doc(db, "configuracoes", "email_templates"), emailTemplates, { merge: true });
      alert('Modelos de e-mail salvos com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar e-mails:', error);
      alert('Erro ao salvar modelos.');
    } finally {
      setIsSavingEmails(false);
    }
  };

  const handleSendMarketing = async () => {
    if (!confirm('Tem certeza que deseja disparar este e-mail para TODOS os clientes cadastrados?')) return;
    
    setIsSendingMarketing(true);
    try {
      const res = await fetch('/api/emails/marketing/send-all', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        alert(`Campanha disparada com sucesso para ${data.sentCount} clientes!`);
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error('Erro ao disparar marketing:', error);
      alert('Erro ao disparar campanha: ' + error.message);
    } finally {
      setIsSendingMarketing(false);
    }
  };

  const handleTestEmail = async (type: string, subject: string, body: string) => {
    const adminEmail = auth.currentUser?.email;
    if (!adminEmail) return alert('Você precisa estar logado para enviar um teste.');

    setIsTestingEmail(p => ({ ...p, [type]: true }));
    try {
      const payload = { 
        email: adminEmail, 
        subject, 
        body, 
        type,
        ...(type === 'marketing' && {
          marketingImageUrl: emailTemplates.marketingImageUrl,
          marketingButtonText: emailTemplates.marketingButtonText,
          marketingButtonLink: emailTemplates.marketingButtonLink
        })
      };

      const res = await fetch('/api/emails/test-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        alert(`E-mail de teste enviado para ${adminEmail}. Verifique sua caixa de entrada (e o spam)!`);
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error('Erro ao testar e-mail:', error);
      alert('Erro ao enviar teste: ' + error.message);
    } finally {
      setIsTestingEmail(p => ({ ...p, [type]: false }));
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

    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    setLoginError('');
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      // O onAuthStateChanged vai lidar com o resto
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setLoginError('Erro ao iniciar login com Google.');
      }
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

  // UPLOAD DA IMAGEM DE MARKETING
  const handleMarketingImageUpload = async (file: File) => {
    setIsSavingEmails(true);
    try {
      const url = await uploadFile(file, 'marketing');
      setEmailTemplates(p => ({ ...p, marketingImageUrl: url }));
      alert("Imagem enviada! Não esqueça de clicar em 'Salvar Modelos de E-mail' no final da página.");
    } catch (e) {
      alert("Erro ao enviar imagem.");
      console.error(e);
    } finally {
      setIsSavingEmails(false);
    }
  };

  const handleAddCategory = async (e: any) => {
    e.preventDefault();
    const name = e.target.catName.value.trim();
    if (!name) return;
    await addDoc(collection(db, "categories"), { name, imageUrl: '', createdAt: serverTimestamp() });
    e.target.reset();
    loadData();
  };

  const handleAddCoupon = async (e: any) => {
    e.preventDefault();
    const code = novoCupom.code.trim().toUpperCase();
    if (!code || !novoCupom.value) return;
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/coupons/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          action: 'create',
          code,
          type: novoCupom.type,
          value: novoCupom.value,
          minOrder: novoCupom.minOrder || '0',
          expiresAt: novoCupom.expiresAt || null,
        }),
      });
      const data = await res.json();
      if (!data.success) { alert('Erro: ' + data.error); return; }
      setNovoCupom({ code: '', type: 'percent', value: '', minOrder: '', expiresAt: '' });
      loadData();
    } catch (err: any) {
      alert('Erro ao criar cupom: ' + err.message);
    }
  };

  const handleToggleCoupon = async (id: string, currentActive: boolean) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/coupons/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ action: 'toggle', code: id, active: !currentActive }),
      });
      const data = await res.json();
      if (!data.success) { alert('Erro: ' + data.error); return; }
      loadData();
    } catch (err: any) {
      alert('Erro ao atualizar cupom: ' + err.message);
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!confirm(`Excluir cupom ${id}?`)) return;
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/coupons/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ action: 'delete', code: id }),
      });
      const data = await res.json();
      if (!data.success) { alert('Erro: ' + data.error); return; }
      loadData();
    } catch (err: any) {
      alert('Erro ao excluir cupom: ' + err.message);
    }
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
    const isNewProduct = !editingId;
    try {
      // Auto-criar categoria na coleção "categories" se vier do campo "Nova Categoria"
      if (showNewCategory && category) {
        const categoryNameNormalized = category.trim().toUpperCase();
        const catQuery = query(collection(db, "categories"), where("name", "==", categoryNameNormalized));
        const catSnap = await getDocs(catQuery);
        if (catSnap.empty) {
          await addDoc(collection(db, "categories"), {
            name: categoryNameNormalized,
            imageUrl: '',
            createdAt: serverTimestamp(),
          });
        }
      }
      let urlCapa = previews.capa, urlDestaque = previews.destaque, urlVetor = removeExistingVetor ? "" : products.find(p => p.id === editingId)?.urls?.download, galeriaUrls = previews.galeria.filter(url => !url.startsWith('blob:'));
      if (fileCapa) urlCapa = await uploadFile(fileCapa, 'capas');
      if (fileDestaque) urlDestaque = await uploadFile(fileDestaque, 'destaques');
      if (fileVetor) urlVetor = await uploadFile(fileVetor, 'downloads');
      if (filesGaleria.length > 0) {
        const novos = await Promise.all(filesGaleria.map(img => uploadFile(img, 'galeria')));
        galeriaUrls = [...galeriaUrls, ...novos];
      }
      const productName = formData.get('productName')?.toString().toUpperCase() || '';
      const productSlug = createSlug(formData.get('productName')?.toString() || '');
      const data = {
        name: productName,
        slug: productSlug,
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
      
      // Se é um produto novo, mostra opção de notificar usuários
      if (isNewProduct) {
        setLastPublishedProduct({ name: productName, slug: productSlug });
      }
      
      location.reload();
    } catch (e) { console.error(e); setLoading(false); }
  };

  const handleSendNewProductNotification = async () => {
    if (!lastPublishedProduct) return;
    setIsSendingPush(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/notifications/new-product', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(lastPublishedProduct),
      });
      const data = await res.json();
      if (data.success) {
        alert(`🔔 Notificação enviada para ${data.sent} dispositivo(s)!`);
        setLastPublishedProduct(null);
      } else {
        throw new Error(data.error || data.message);
      }
    } catch (err: any) {
      alert('Erro ao enviar notificação: ' + err.message);
    } finally {
      setIsSendingPush(false);
    }
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
                <Image src="/google.svg" alt="Google" width={18} height={18} />
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

  // --- LÓGICA DERIVADA: BUSCA E PAGINAÇÃO DE PRODUTOS ---
  const produtosFiltrados = products.filter(p =>
    p.name?.toLowerCase().includes(buscaProduto.toLowerCase()) ||
    p.category?.toLowerCase().includes(buscaProduto.toLowerCase())
  );
  const totalPaginas = Math.ceil(produtosFiltrados.length / ITENS_POR_PAGINA);
  const produtosPaginados = produtosFiltrados.slice(
    (paginaAtual - 1) * ITENS_POR_PAGINA,
    paginaAtual * ITENS_POR_PAGINA
  );

  return (
    <div className="min-h-screen bg-[#050505] pt-16 md:pt-10 pb-20 font-sans text-gray-400 selection:bg-[#fe7302]/30">
      <main className="max-w-7xl mx-auto px-4">
        
        {/* CABEÇALHO DO PAINEL */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <div>
            <h1 className="text-[20px] font-black text-white uppercase tracking-[0.3em] mb-2">Dashboard</h1>
            <p className="text-[9px] font-bold text-[#fe7302] uppercase tracking-[0.4em]">Gestão de Ativos Digitais</p>
          </div>
          <div className="flex flex-wrap items-center gap-4 bg-[#111111] p-2 rounded-2xl border border-white/5">
             <button onClick={() => setActiveTab('produtos')} className={`px-6 md:px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'produtos' ? 'bg-[#fe7302] text-white shadow-lg shadow-orange-600/20' : 'text-gray-500 hover:text-white'}`}>Produtos</button>
             <button onClick={() => setActiveTab('pedidos')} className={`px-6 md:px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'pedidos' ? 'bg-[#fe7302] text-white shadow-lg shadow-orange-600/20' : 'text-gray-500 hover:text-white'}`}>Vendas</button>
             <button onClick={() => setActiveTab('clientes')} className={`px-6 md:px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'clientes' ? 'bg-[#fe7302] text-white shadow-lg shadow-orange-600/20' : 'text-gray-500 hover:text-white'}`}>Clientes</button>
             <button onClick={() => setActiveTab('design')} className={`px-6 md:px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'design' ? 'bg-[#fe7302] text-white shadow-lg shadow-orange-600/20' : 'text-gray-500 hover:text-white'}`}>Design</button>
             <button onClick={() => setActiveTab('blog')} className={`px-6 md:px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'blog' ? 'bg-[#fe7302] text-white shadow-lg shadow-orange-600/20' : 'text-gray-500 hover:text-white'}`}>Blog</button>
             <button onClick={() => setActiveTab('emails')} className={`px-6 md:px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'emails' ? 'bg-[#fe7302] text-white shadow-lg shadow-orange-600/20' : 'text-gray-500 hover:text-white'}`}>E-mails</button>
             <div className="w-[1px] h-6 bg-white/10 mx-2"></div>
             <button onClick={handleAdminLogout} className="p-3 text-red-500/50 hover:text-red-500 transition-colors"><X size={20}/></button>
          </div>
        </div>
        
        {/* MÉTRICAS PREMIUM */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <button onClick={() => setActiveTab('clientes')} className="bg-[#111111] p-8 rounded-[2.5rem] border border-white/5 flex items-center gap-6 shadow-2xl group hover:border-blue-500/40 transition-all text-left w-full">
                <div className="p-4 bg-blue-500/10 text-blue-500 rounded-2xl group-hover:scale-110 transition-transform"><Users size={28}/></div>
                <div><p className="text-[9px] font-black uppercase text-gray-500 tracking-widest mb-2">Clientes</p><h3 className="text-2xl font-black text-white tracking-tighter">{metricas.clientes}</h3><p className="text-[8px] text-blue-500/60 font-bold uppercase tracking-widest mt-1">Ver lista →</p></div>
            </button>
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

              {/* BOTÃO DE NOTIFICAÇÃO — aparece após publicar novo produto */}
              {lastPublishedProduct && (
                <div className="bg-[#fe7302]/10 border border-[#fe7302]/30 rounded-[2rem] p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="p-3 bg-[#fe7302]/20 rounded-2xl">
                    <Megaphone size={24} className="text-[#fe7302]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[11px] font-black text-white uppercase tracking-widest mb-1">Produto publicado!</p>
                    <p className="text-[10px] text-gray-400 font-medium">Quer notificar todos os usuários sobre <span className="text-[#fe7302] font-bold">{lastPublishedProduct.name}</span>?</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleSendNewProductNotification}
                      disabled={isSendingPush}
                      className="bg-[#fe7302] text-white font-black text-[10px] uppercase tracking-widest px-5 py-3 rounded-2xl hover:bg-[#e56600] transition-all flex items-center gap-2 disabled:opacity-60"
                    >
                      {isSendingPush ? <Loader2 size={14} className="animate-spin" /> : <Megaphone size={14} />}
                      {isSendingPush ? 'Enviando...' : 'Notificar Usuários'}
                    </button>
                    <button
                      onClick={() => setLastPublishedProduct(null)}
                      className="text-gray-600 hover:text-gray-400 transition-colors text-[10px] font-bold uppercase tracking-widest"
                    >
                      Agora não
                    </button>
                  </div>
                </div>
              )}

              {/* LISTAGEM DE GESTÃO */}
              <div className="space-y-6">
                {/* CABEÇALHO COM BADGE DINÂMICO */}
                <div className="flex items-center gap-4">
                  <h2 className="text-[11px] font-black uppercase text-gray-600 tracking-[0.5em]">Produtos Cadastrados</h2>
                  <span className="text-[9px] font-bold text-gray-600 uppercase bg-white/5 px-3 py-1 rounded-full">
                    {buscaProduto
                      ? `${produtosFiltrados.length} de ${products.length} produtos`
                      : `${products.length} produtos`
                    }
                  </span>
                  <div className="h-px flex-1 bg-white/5"></div>
                </div>

                {/* CAMPO DE BUSCA */}
                <div className="relative">
                  <Search size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none" />
                  <input
                    id="admin-product-search"
                    type="text"
                    placeholder="Buscar por nome ou categoria..."
                    value={buscaProduto}
                    onChange={e => { setBuscaProduto(e.target.value); setPaginaAtual(1); }}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-[12px] text-white font-medium outline-none focus:border-[#fe7302]/50 focus:bg-white/[0.08] transition-all placeholder:text-gray-600"
                  />
                  {buscaProduto && (
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[9px] font-black text-gray-500 uppercase tracking-widest">
                      {produtosFiltrados.length} resultado{produtosFiltrados.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                {/* GRID DE PRODUTOS PAGINADOS */}
                <div className="grid grid-cols-1 gap-4">
                  {produtosPaginados.length === 0 ? (
                    <div className="text-center py-16 text-gray-600">
                      <Search size={40} className="mx-auto mb-4 opacity-30" />
                      <p className="text-[11px] font-black uppercase tracking-widest">
                        {buscaProduto
                          ? `Nenhum produto encontrado para "${buscaProduto}"`
                          : 'Nenhum produto cadastrado ainda'
                        }
                      </p>
                    </div>
                  ) : (
                    produtosPaginados.map(p => (
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
                    ))
                  )}
                </div>

                {/* CONTROLES DE PAGINAÇÃO */}
                {totalPaginas > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-white/5">
                    <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest">
                      {(paginaAtual - 1) * ITENS_POR_PAGINA + 1}–{Math.min(paginaAtual * ITENS_POR_PAGINA, produtosFiltrados.length)} de {produtosFiltrados.length}
                    </p>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPaginaAtual(p => Math.max(1, p - 1))}
                        disabled={paginaAtual === 1}
                        className="px-5 py-2 rounded-xl bg-white/5 text-gray-500 text-[10px] font-black uppercase tracking-widest border border-white/5 hover:bg-white/10 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        ← Anterior
                      </button>

                      {Array.from({ length: totalPaginas }, (_, i) => i + 1)
                        .filter(n => n === 1 || n === totalPaginas || Math.abs(n - paginaAtual) <= 1)
                        .reduce<(number | '...')[]>((acc, n, idx, arr) => {
                          if (idx > 0 && (n as number) - (arr[idx - 1] as number) > 1) acc.push('...');
                          acc.push(n);
                          return acc;
                        }, [])
                        .map((item, idx) =>
                          item === '...' ? (
                            <span key={`ellipsis-${idx}`} className="text-gray-700 text-[10px] font-black px-1">…</span>
                          ) : (
                            <button
                              key={item}
                              onClick={() => setPaginaAtual(item as number)}
                              className={`w-9 h-9 rounded-xl text-[10px] font-black transition-all ${
                                paginaAtual === item
                                  ? 'bg-[#fe7302] text-white shadow-lg shadow-orange-600/20'
                                  : 'bg-white/5 text-gray-500 border border-white/5 hover:bg-white/10 hover:text-white'
                              }`}
                            >
                              {item}
                            </button>
                          )
                        )
                      }

                      <button
                        onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p + 1))}
                        disabled={paginaAtual === totalPaginas}
                        className="px-5 py-2 rounded-xl bg-white/5 text-gray-500 text-[10px] font-black uppercase tracking-widest border border-white/5 hover:bg-white/10 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        Próxima →
                      </button>
                    </div>
                  </div>
                )}
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

                {/* PAINEL DE CUPONS */}
                <div className="bg-[#111111] p-10 rounded-[3rem] border border-white/5 shadow-2xl">
                  <div className="flex items-center justify-between mb-10">
                    <h2 className="text-[12px] font-black uppercase text-white flex items-center gap-4 tracking-widest"><Tag size={20} className="text-[#fe7302]"/> Cupons de Desconto</h2>
                    <span className="text-[9px] font-bold text-gray-600 uppercase bg-white/5 px-3 py-1 rounded-full">{cupons.length} CUPONS</span>
                  </div>

                  {/* FORMULÁRIO NOVO CUPOM */}
                  <form onSubmit={handleAddCoupon} className="space-y-4 mb-10 bg-white/[0.02] p-6 rounded-[2rem] border border-white/5">
                    <p className="text-[9px] font-black uppercase text-gray-500 tracking-widest mb-4">Criar Novo Cupom</p>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        placeholder="CÓDIGO (ex: CORRIDA10)"
                        value={novoCupom.code}
                        onChange={e => setNovoCupom(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                        className="col-span-2 bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-[11px] font-black text-white uppercase outline-none focus:border-[#fe7302]/50 transition-all placeholder:text-gray-700 tracking-widest"
                        required
                      />
                      <select
                        value={novoCupom.type}
                        onChange={e => setNovoCupom(p => ({ ...p, type: e.target.value }))}
                        className="bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-[11px] font-black text-white uppercase outline-none focus:border-[#fe7302]/50 transition-all cursor-pointer appearance-none"
                      >
                        <option value="percent" className="bg-[#111]">% Percentual</option>
                        <option value="fixed" className="bg-[#111]">R$ Valor Fixo</option>
                      </select>
                      <input
                        type="number"
                        placeholder={novoCupom.type === 'percent' ? 'Valor (ex: 10)' : 'Valor R$ (ex: 5)'}
                        value={novoCupom.value}
                        onChange={e => setNovoCupom(p => ({ ...p, value: e.target.value }))}
                        min="0"
                        step="0.01"
                        className="bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-[11px] font-black text-white outline-none focus:border-[#fe7302]/50 transition-all placeholder:text-gray-700"
                        required
                      />
                      <input
                        type="number"
                        placeholder="Pedido mínimo R$ (0 = sem mínimo)"
                        value={novoCupom.minOrder}
                        onChange={e => setNovoCupom(p => ({ ...p, minOrder: e.target.value }))}
                        min="0"
                        step="0.01"
                        className="bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-[11px] font-black text-white outline-none focus:border-[#fe7302]/50 transition-all placeholder:text-gray-700"
                      />
                      <div className="col-span-2 space-y-1">
                        <label className="text-[9px] font-black uppercase text-gray-600 ml-2 tracking-widest">Validade (deixe vazio = sem expiração)</label>
                        <input
                          type="datetime-local"
                          value={novoCupom.expiresAt}
                          onChange={e => setNovoCupom(p => ({ ...p, expiresAt: e.target.value }))}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-[11px] font-black text-white outline-none focus:border-[#fe7302]/50 transition-all [color-scheme:dark]"
                        />
                      </div>
                    </div>
                    <button type="submit" className="w-full bg-[#fe7302] text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] transition-all shadow-lg shadow-orange-600/20 flex items-center justify-center gap-2">
                      <Plus size={16}/> Criar Cupom
                    </button>
                  </form>

                  {/* LISTA DE CUPONS */}
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    {cupons.length === 0 && (
                      <p className="text-[10px] text-gray-700 uppercase tracking-widest text-center py-8">Nenhum cupom cadastrado</p>
                    )}
                    {cupons.map(cup => {
                      const expired = cup.expiresAt && (cup.expiresAt.toDate ? cup.expiresAt.toDate() : new Date(cup.expiresAt)) < new Date();
                      return (
                        <div key={cup.id} className={`flex items-center justify-between p-4 rounded-[1.5rem] border transition-all ${cup.active && !expired ? 'bg-white/[0.03] border-white/5 hover:bg-white/[0.06]' : 'bg-white/[0.01] border-white/[0.03] opacity-50'}`}>
                          <div className="flex items-center gap-4">
                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${cup.active && !expired ? 'bg-green-500' : 'bg-gray-600'}`} />
                            <div>
                              <p className="text-[12px] font-black text-white uppercase tracking-wider">{cup.id}</p>
                              <p className="text-[9px] text-gray-600 uppercase tracking-widest mt-0.5">
                                {cup.type === 'percent' ? `${cup.value}% de desconto` : `R$ ${Number(cup.value).toFixed(2)} de desconto`}
                                {cup.minOrder > 0 && ` · Mín. R$ ${Number(cup.minOrder).toFixed(2)}`}
                                {` · ${cup.usedCount || 0} uso(s)`}
                                {expired && ' · EXPIRADO'}
                              </p>
                              {cup.expiresAt && (
                                <p className="text-[9px] text-gray-700 flex items-center gap-1 mt-0.5">
                                  <Clock size={9}/> {(cup.expiresAt.toDate ? cup.expiresAt.toDate() : new Date(cup.expiresAt)).toLocaleDateString('pt-BR')}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleToggleCoupon(cup.id, cup.active)}
                              className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-xl transition-all ${ cup.active ? 'bg-green-500/10 text-green-500 hover:bg-red-500/10 hover:text-red-400' : 'bg-white/5 text-gray-600 hover:bg-green-500/10 hover:text-green-400'}`}
                            >
                              {cup.active ? 'Ativo' : 'Inativo'}
                            </button>
                            <button
                              onClick={() => handleDeleteCoupon(cup.id)}
                              className="p-2 text-gray-700 hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={15}/>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

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

                  <button 
                    onClick={() => handleTestEmail('welcome', emailTemplates.welcomeSubject, emailTemplates.welcomeBody)}
                    disabled={isTestingEmail['welcome']}
                    className="w-full bg-white/5 text-white/50 border border-white/10 py-3 rounded-xl font-bold uppercase tracking-widest text-[9px] hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-2"
                  >
                    {isTestingEmail['welcome'] ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
                    Enviar E-mail de Teste para Mim
                  </button>
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
                    <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest ml-4">Use {'{{nome}}'} e {'{{codigo_pix}}'}.</p>
                  </div>

                  <button 
                    onClick={() => handleTestEmail('pix', emailTemplates.pixSubject, emailTemplates.pixBody)}
                    disabled={isTestingEmail['pix']}
                    className="w-full bg-white/5 text-white/50 border border-white/10 py-3 rounded-xl font-bold uppercase tracking-widest text-[9px] hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-2"
                  >
                    {isTestingEmail['pix'] ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
                    Enviar E-mail de Teste para Mim
                  </button>
                </div>


                {/* E-MAIL ENTREGA */}
                <div className="bg-[#111111] p-10 rounded-[3rem] border border-white/5 shadow-2xl space-y-6">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-green-500/10 text-green-500 flex items-center justify-center">
                      <Package size={24} />
                    </div>
                    <div>
                      <h3 className="text-[14px] font-black text-white uppercase tracking-widest">Entrega dos Vetores</h3>
                      <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Links de Download (Pós-Pagamento)</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[9px] font-black uppercase text-gray-500 ml-4 tracking-widest">Assunto do E-mail</label>
                    <input 
                      value={emailTemplates.deliverySubject}
                      onChange={e => setEmailTemplates(p => ({...p, deliverySubject: e.target.value}))}
                      className="w-full bg-white/5 border border-white/10 rounded-[1.5rem] p-5 text-[12px] text-white outline-none focus:border-[#fe7302]/50 transition-all" 
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="text-[9px] font-black uppercase text-gray-500 ml-4 tracking-widest">Corpo da Mensagem (Suporta variáveis)</label>
                    <textarea 
                      value={emailTemplates.deliveryBody}
                      onChange={e => setEmailTemplates(p => ({...p, deliveryBody: e.target.value}))}
                      className="w-full h-40 bg-white/5 border border-white/10 rounded-[1.5rem] p-5 text-[12px] text-white outline-none focus:border-[#fe7302]/50 transition-all resize-none" 
                    ></textarea>
                    <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest ml-4">Use {'{{nome}}'} e {'{{links}}'}.</p>
                  </div>

                  <button 
                    onClick={() => handleTestEmail('delivery', emailTemplates.deliverySubject, emailTemplates.deliveryBody)}
                    disabled={isTestingEmail['delivery']}
                    className="w-full bg-white/5 text-white/50 border border-white/10 py-3 rounded-xl font-bold uppercase tracking-widest text-[9px] hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-2"
                  >
                    {isTestingEmail['delivery'] ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
                    Enviar E-mail de Teste para Mim
                  </button>
                </div>


                {/* E-MAIL MARKETING */}
                <div className="bg-[#111111] p-10 rounded-[3rem] border border-white/5 shadow-2xl space-y-6">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                      <Tag size={24} />
                    </div>
                    <div>
                      <h3 className="text-[14px] font-black text-white uppercase tracking-widest">Marketing</h3>
                      <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Promoções e Avisos</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[9px] font-black uppercase text-gray-500 ml-4 tracking-widest">Assunto do E-mail</label>
                    <input 
                      value={emailTemplates.marketingSubject}
                      onChange={e => setEmailTemplates(p => ({...p, marketingSubject: e.target.value}))}
                      className="w-full bg-white/5 border border-white/10 rounded-[1.5rem] p-5 text-[12px] text-white outline-none focus:border-[#fe7302]/50 transition-all" 
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="text-[9px] font-black uppercase text-gray-500 ml-4 tracking-widest">Corpo da Mensagem</label>
                    <textarea 
                      value={emailTemplates.marketingBody}
                      onChange={e => setEmailTemplates(p => ({...p, marketingBody: e.target.value}))}
                      className="w-full h-40 bg-white/5 border border-white/10 rounded-[1.5rem] p-5 text-[12px] text-white outline-none focus:border-[#fe7302]/50 transition-all resize-none" 
                    ></textarea>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[9px] font-black uppercase text-gray-500 ml-4 tracking-widest">Banner Promocional (Opcional)</label>
                    <div className="flex items-center gap-6 p-4 bg-white/[0.02] rounded-[2rem] border border-white/5">
                      <div className="relative w-32 h-20 bg-black/40 rounded-2xl border border-white/5 flex items-center justify-center overflow-hidden group-hover:border-[#fe7302]/50 transition-all shadow-inner">
                        {emailTemplates.marketingImageUrl ? (
                          <img src={emailTemplates.marketingImageUrl} alt="Banner" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon size={24} className="text-gray-700" />
                        )}
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={(e) => e.target.files?.[0] && handleMarketingImageUpload(e.target.files[0])}
                          className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-[11px] font-bold text-gray-400">Clique na caixa ao lado para fazer upload.</p>
                        <p className="text-[9px] text-gray-600 mt-1">Recomendado: Formato paisagem (ex: 600x300px).</p>
                        {emailTemplates.marketingImageUrl && (
                          <button 
                            onClick={() => setEmailTemplates(p => ({...p, marketingImageUrl: ''}))}
                            className="mt-2 text-[10px] text-red-500 hover:text-red-400 font-bold"
                          >
                            Remover Imagem
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <label className="text-[9px] font-black uppercase text-gray-500 ml-4 tracking-widest">Texto do Botão</label>
                      <input 
                        value={emailTemplates.marketingButtonText}
                        onChange={e => setEmailTemplates(p => ({...p, marketingButtonText: e.target.value}))}
                        placeholder="Ex: Aproveitar Agora"
                        className="w-full bg-white/5 border border-white/10 rounded-[1.5rem] p-5 text-[12px] text-white outline-none focus:border-[#fe7302]/50 transition-all" 
                      />
                    </div>
                    <div className="space-y-4">
                      <label className="text-[9px] font-black uppercase text-gray-500 ml-4 tracking-widest">Link do Botão</label>
                      <input 
                        value={emailTemplates.marketingButtonLink}
                        onChange={e => setEmailTemplates(p => ({...p, marketingButtonLink: e.target.value}))}
                        placeholder="Ex: https://camisavetor.com/produtos"
                        className="w-full bg-white/5 border border-white/10 rounded-[1.5rem] p-5 text-[12px] text-white outline-none focus:border-[#fe7302]/50 transition-all" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/5">
                    <button 
                      onClick={() => handleTestEmail('marketing', emailTemplates.marketingSubject, emailTemplates.marketingBody)}
                      disabled={isTestingEmail['marketing']}
                      className="bg-white/5 text-white/50 border border-white/10 py-4 rounded-2xl font-bold uppercase tracking-widest text-[9px] hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-2"
                    >
                      {isTestingEmail['marketing'] ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
                      Enviar Teste para Mim
                    </button>

                    <button 
                      onClick={handleSendMarketing}
                      disabled={isSendingMarketing}
                      className="bg-purple-600/20 text-purple-400 border border-purple-500/30 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-purple-600 hover:text-white transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                      {isSendingMarketing ? <Loader2 size={16} className="animate-spin" /> : <Megaphone size={16} />}
                      Disparar Campanha para Todos
                    </button>
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

          {activeTab === 'pedidos' && (
            <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 space-y-8">
              {/* CABEÇALHO DA ABA */}
              <div className="flex items-center gap-4">
                <h2 className="text-[11px] font-black uppercase text-gray-600 tracking-[0.5em]">Gestão de Pedidos & Pagamentos</h2>
                <span className="text-[9px] font-bold text-gray-600 uppercase bg-white/5 px-3 py-1 rounded-full">{pedidos.length} PEDIDOS</span>
                <div className="h-px flex-1 bg-white/5"></div>
              </div>

              {/* FILTROS E BUSCA */}
              <div className="flex flex-col md:flex-row gap-6 items-center justify-between bg-[#111111] p-6 rounded-[2rem] border border-white/5 shadow-2xl">
                {/* Filtro de Status */}
                <div className="flex flex-wrap gap-2">
                  {(['todos', 'pago', 'pendente', 'cancelado'] as const).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setFiltroStatus(status)}
                      className={`px-5 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${
                        filtroStatus === status
                          ? 'bg-[#fe7302] text-white border-[#fe7302] shadow-lg shadow-orange-600/20'
                          : 'bg-white/5 text-gray-500 border-white/5 hover:border-white/10 hover:text-white'
                      }`}
                    >
                      {status === 'todos' ? 'Todos' : status === 'pago' ? 'Aprovados' : status === 'pendente' ? 'Pendentes' : 'Cancelados'}
                    </button>
                  ))}
                </div>

                {/* Campo de Busca */}
                <div className="relative w-full md:w-80 flex items-center bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus-within:border-[#fe7302]/50 transition-all">
                  <Search size={14} className="text-gray-600 mr-3" />
                  <input
                    type="text"
                    placeholder="BUSCAR POR E-MAIL OU ID..."
                    value={buscaPedido}
                    onChange={(e) => setBuscaPedido(e.target.value)}
                    className="w-full bg-transparent text-[10px] font-black uppercase tracking-wider text-white placeholder:text-gray-600 outline-none"
                  />
                </div>
              </div>

              {/* LISTA DE PEDIDOS */}
              <div className="space-y-6">
                {(() => {
                  const filtered = pedidos.filter(p => {
                    const matchesStatus = filtroStatus === 'todos' || p.status === filtroStatus;
                    const matchesSearch = !buscaPedido || 
                      p.email?.toLowerCase().includes(buscaPedido.toLowerCase()) ||
                      p.id?.toLowerCase().includes(buscaPedido.toLowerCase());
                    return matchesStatus && matchesSearch;
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="bg-[#111111] border border-white/5 rounded-[2.5rem] p-16 text-center">
                        <Package className="mx-auto text-gray-800 stroke-[1px] mb-4" size={48} />
                        <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Nenhum pedido encontrado.</p>
                      </div>
                    );
                  }

                  return filtered.map(pedido => {
                    const totalVal = pedido.total || pedido.items?.reduce((sum: number, item: any) => sum + (Number(item.price) * (item.quantity || 1)), 0) || 0;
                    const formattedTotal = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalVal);
                    
                    let dateStr = 'Data indisponível';
                    if (pedido.createdAt) {
                      try {
                        const dateObj = pedido.createdAt.toDate ? pedido.createdAt.toDate() : new Date(pedido.createdAt);
                        dateStr = dateObj.toLocaleString('pt-BR');
                      } catch (err) {
                        console.error(err);
                      }
                    }

                    return (
                      <div key={pedido.id} className="bg-[#111111] rounded-[2.5rem] border border-white/5 overflow-hidden hover:border-[#fe7302]/30 transition-all duration-300">
                        {/* Header do pedido */}
                        <div className="bg-white/[0.01] border-b border-white/5 px-8 py-6 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                          <div className="flex flex-wrap gap-8 items-center">
                            <div>
                              <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1.5">ID Transação</p>
                              <p className="text-[11px] font-black text-white font-mono uppercase text-xs">#{pedido.id}</p>
                            </div>
                            <div>
                              <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Cliente</p>
                              <p className="text-[11px] font-bold text-gray-300">{pedido.email}</p>
                            </div>
                            <div>
                              <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Data / Hora</p>
                              <p className="text-[11px] font-bold text-gray-400 flex items-center gap-1.5"><Calendar size={12}/>{dateStr}</p>
                            </div>
                            <div>
                              <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Total</p>
                              <p className="text-[11px] font-black text-[#fe7302]">{formattedTotal}</p>
                            </div>
                            {pedido.paymentMethod && (
                              <div>
                                <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Método</p>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{pedido.paymentMethod}</p>
                              </div>
                            )}
                          </div>

                          {/* Status do pedido & Ações */}
                          <div className="flex flex-wrap items-center gap-4">
                            <span className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 ${
                              pedido.status === 'pago'
                                ? 'bg-green-500/10 text-green-500'
                                : pedido.status === 'pendente'
                                ? 'bg-orange-500/10 text-orange-500 animate-pulse'
                                : 'bg-red-500/10 text-red-500'
                            }`}>
                              {pedido.status === 'pago' ? <CheckCircle2 size={12}/> : pedido.status === 'pendente' ? <Clock size={12}/> : <X size={12}/>}
                              {pedido.status === 'pago' ? 'Aprovado' : pedido.status === 'pendente' ? 'Pendente' : 'Cancelado'}
                            </span>

                            {/* Ações de Alteração de Status */}
                            <div className="flex gap-2">
                              {pedido.status !== 'pago' && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateOrderStatus(pedido.id, 'pago')}
                                  className="bg-green-600 hover:bg-green-500 text-white text-[9px] font-black uppercase px-4 py-2 rounded-xl transition-all shadow-lg shadow-green-900/10"
                                >
                                  Aprovar
                                </button>
                              )}
                              {pedido.status !== 'pendente' && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateOrderStatus(pedido.id, 'pendente')}
                                  className="bg-orange-600/10 hover:bg-orange-600/20 text-orange-400 text-[9px] font-black uppercase px-4 py-2 rounded-xl border border-orange-500/10 transition-all"
                                >
                                  Pendente
                                </button>
                              )}
                              {pedido.status !== 'cancelado' && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateOrderStatus(pedido.id, 'cancelado')}
                                  className="bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[9px] font-black uppercase px-4 py-2 rounded-xl border border-red-500/10 transition-all"
                                >
                                  Cancelar
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Itens do pedido */}
                        <div className="p-8 space-y-4">
                          {pedido.items?.map((item: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-6 bg-white/[0.01] border border-white/5 p-4 rounded-2xl">
                              {item.image && (
                                <div className="w-14 h-14 relative rounded-xl overflow-hidden bg-black/40 border border-white/5 flex-shrink-0">
                                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-black text-white uppercase tracking-wider truncate">{item.name}</p>
                                <p className="text-[9px] font-bold text-gray-500 uppercase mt-1">
                                  Qtd: {item.quantity || 1} • Unitário: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}

          {/* ABA CLIENTES */}
          {activeTab === 'clientes' && (
            <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
              <div className="flex items-center gap-4 mb-8">
                <div className="h-px flex-1 bg-white/5"></div>
                <p className="text-[9px] font-black uppercase text-gray-500 tracking-[0.3em] flex items-center gap-2"><Users size={12}/> Lista de Clientes</p>
                <div className="h-px flex-1 bg-white/5"></div>
              </div>

              {/* Busca */}
              <div className="relative mb-8 max-w-md">
                <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder="Buscar por nome ou e-mail..."
                  value={buscaCliente}
                  onChange={e => setBuscaCliente(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#111111] border border-white/5 rounded-2xl text-[12px] text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/40 transition-colors"
                />
              </div>

              {/* Lista */}
              <div className="space-y-3">
                {listaClientes
                  .filter(c =>
                    c.name?.toLowerCase().includes(buscaCliente.toLowerCase()) ||
                    c.email?.toLowerCase().includes(buscaCliente.toLowerCase())
                  )
                  .map(cliente => (
                    <div key={cliente.uid} className="bg-[#111111] border border-white/5 rounded-2xl p-5 flex items-center gap-5 hover:border-white/10 transition-all group">
                      {/* Avatar */}
                      <div className="w-11 h-11 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {cliente.photoURL ? (
                          <img src={cliente.photoURL} alt={cliente.name} className="w-full h-full object-cover rounded-full" />
                        ) : (
                          <Users size={18} className="text-blue-400" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-black text-white truncate">{cliente.name || 'Sem nome'}</p>
                        <p className="text-[10px] text-gray-500 font-medium truncate mt-0.5">{cliente.email}</p>
                        <div className="flex items-center gap-3 mt-1.5">
                          {cliente.createdAt && (
                            <p className="text-[9px] text-gray-600 font-bold uppercase tracking-wider">
                              Cadastro: {new Date(cliente.createdAt?.seconds ? cliente.createdAt.seconds * 1000 : cliente.createdAt).toLocaleDateString('pt-BR')}
                            </p>
                          )}
                          
                          {/* Ícone do Método de Cadastro */}
                          {cliente.provider && (
                            <div className="flex items-center gap-1.5 bg-white/5 px-2 py-0.5 rounded text-[9px] text-gray-400 font-bold uppercase tracking-wider" title={`Cadastrado via ${cliente.provider}`}>
                              {cliente.provider === 'google.com' ? (
                                <>
                                  <Image src="/google.svg" alt="Google" width={10} height={10} />
                                  Google
                                </>
                              ) : (
                                <>
                                  <Mail size={10} />
                                  E-mail
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Contador de Pedidos */}
                      {(() => {
                        const total = getComprasCliente(cliente.uid);
                        return (
                          <div
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg ${total > 0 ? 'text-orange-400/70' : 'text-gray-700'}`}
                            title={`${total} pedido${total !== 1 ? 's' : ''} pago${total !== 1 ? 's' : ''}`}
                          >
                            <Package size={11} />
                            <span className="text-[10px] font-bold tabular-nums">{total}</span>
                          </div>
                        );
                      })()}

                      {/* Botão Deletar */}
                      <button
                        onClick={() => handleDeleteCliente(cliente.uid, cliente.name || cliente.email)}
                        className="p-2.5 rounded-xl text-red-500/30 hover:text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                        title="Deletar cliente"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}

                {listaClientes.filter(c =>
                  c.name?.toLowerCase().includes(buscaCliente.toLowerCase()) ||
                  c.email?.toLowerCase().includes(buscaCliente.toLowerCase())
                ).length === 0 && (
                  <div className="text-center py-16 text-gray-600">
                    <Users size={40} className="mx-auto mb-4 opacity-30" />
                    <p className="text-[12px] font-bold uppercase tracking-widest">Nenhum cliente encontrado</p>
                  </div>
                )}
              </div>

              {/* Contador */}
              <div className="mt-6 text-center">
                <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">
                  {listaClientes.filter(c =>
                    c.name?.toLowerCase().includes(buscaCliente.toLowerCase()) ||
                    c.email?.toLowerCase().includes(buscaCliente.toLowerCase())
                  ).length} de {listaClientes.length} clientes
                </p>
              </div>
            </div>
          )}

          {/* ABA BLOG */}
          {activeTab === 'blog' && (
            <div className="animate-fade-in">
              <BlogTab />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
