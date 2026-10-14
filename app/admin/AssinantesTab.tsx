'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Crown,
  Users,
  CreditCard,
  QrCode,
  Sparkles,
  Search,
  Download,
  Plus,
  Minus,
  Edit2,
  Check,
  X,
  Loader2,
  RefreshCw,
  ExternalLink,
  Calendar,
  AlertCircle,
  FileCode,
  Layers,
  Phone,
} from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import Image from 'next/image';

interface SubscriberData {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  cpf?: string;
  photoURL?: string;
  isSubscriber: boolean;
  subscriptionPlan: 'pro' | 'grafica';
  subscriptionStatus: 'active' | 'paused' | 'canceled';
  subscriptionId?: string;
  subscriptionMethod?: 'card' | 'pix';
  subscriptionExpiresAt?: any;
  subscriptionRenewsAt?: any;
  monthlyCredits: number;
  availableCredits: number;
  downloadHistory?: Array<{
    productId: string;
    downloadedAt: any;
    method?: 'credit' | 'direct_purchase';
  }>;
  createdAt?: any;
}

interface AssinantesTabProps {
  products?: any[];
}

function formatDate(val: any): string {
  if (!val) return 'Não definida';
  let date: Date | null = null;
  if (val?._seconds) {
    date = new Date(val._seconds * 1000);
  } else if (val?.seconds) {
    date = new Date(val.seconds * 1000);
  } else if (typeof val === 'string' || typeof val === 'number') {
    date = new Date(val);
  } else if (val instanceof Date) {
    date = val;
  }
  if (!date || isNaN(date.getTime())) return 'Não definida';
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatDateTime(val: any): string {
  if (!val) return 'Data não registrada';
  let date: Date | null = null;
  if (val?._seconds) {
    date = new Date(val._seconds * 1000);
  } else if (val?.seconds) {
    date = new Date(val.seconds * 1000);
  } else if (typeof val === 'string' || typeof val === 'number') {
    date = new Date(val);
  } else if (val instanceof Date) {
    date = val;
  }
  if (!date || isNaN(date.getTime())) return 'Data não registrada';
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AssinantesTab({ products = [] }: AssinantesTabProps) {
  const [subscribers, setSubscribers] = useState<SubscriberData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [planFilter, setPlanFilter] = useState<'todos' | 'pro' | 'grafica'>('todos');
  const [methodFilter, setMethodFilter] = useState<'todos' | 'card' | 'pix'>('todos');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'active' | 'paused' | 'canceled'>('todos');

  // Modal de Histórico de Downloads
  const [selectedSubscriber, setSelectedSubscriber] = useState<SubscriberData | null>(null);

  // Modal / Ação de Ajuste de Créditos
  const [creditModalUser, setCreditModalUser] = useState<SubscriberData | null>(null);
  const [customCreditInput, setCustomCreditInput] = useState<string>('');
  const [isAdjustingCredits, setIsAdjustingCredits] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Mapa de produtos para busca rápida por ID
  const productMap = useMemo(() => {
    const map = new Map<string, any>();
    products.forEach((p) => {
      if (p.id) map.set(p.id, p);
    });
    return map;
  }, [products]);

  // Carrega e assina a coleção de usuários em tempo real no Firestore
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    // Consulta inicial via API como fallback seguro
    const fetchViaApi = async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) return;
        const res = await fetch('/api/admin/assinantes', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok && isMounted) {
          const data = await res.json();
          if (Array.isArray(data.assinantes)) {
            setSubscribers(data.assinantes);
          }
        }
      } catch (err) {
        console.error('Erro na consulta inicial de assinantes:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchViaApi();

    // Listener em tempo real direto no Firestore
    let unsubscribeSnapshot: (() => void) | undefined;
    try {
      const q = query(collection(db, 'users'), where('isSubscriber', '==', true));
      unsubscribeSnapshot = onSnapshot(
        q,
        (snapshot) => {
          if (!isMounted) return;
          const list: SubscriberData[] = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            const subId = String(data.subscriptionId || '');
            const isPix = subId.startsWith('pix_') || data.subscriptionMethod === 'pix';
            return {
              uid: docSnap.id,
              name: data.nome || data.name || data.displayName || 'Sem nome',
              email: data.email || '',
              phone: data.phone || '',
              cpf: data.cpf || '',
              photoURL: data.photoURL || '',
              isSubscriber: data.isSubscriber === true,
              subscriptionPlan: data.subscriptionPlan === 'grafica' ? 'grafica' : 'pro',
              subscriptionStatus: data.subscriptionStatus || 'active',
              subscriptionId: subId,
              subscriptionMethod: isPix ? 'pix' : 'card',
              subscriptionExpiresAt: data.subscriptionExpiresAt || data.subscriptionRenewsAt || null,
              subscriptionRenewsAt: data.subscriptionRenewsAt || null,
              monthlyCredits: Number(data.monthlyCredits) || (data.subscriptionPlan === 'grafica' ? 40 : 15),
              availableCredits: Number(data.availableCredits) || 0,
              downloadHistory: Array.isArray(data.downloadHistory)
                ? data.downloadHistory
                : Array.isArray(data.redeemedProducts)
                ? data.redeemedProducts
                : Array.isArray(data.downloads)
                ? data.downloads
                : [],
              createdAt: data.createdAt || null,
            };
          });

          // Ordena pela expiração/renovação decrescente
          list.sort((a, b) => {
            const tA = a.subscriptionExpiresAt?.seconds
              ? a.subscriptionExpiresAt.seconds * 1000
              : new Date(a.subscriptionExpiresAt || 0).getTime();
            const tB = b.subscriptionExpiresAt?.seconds
              ? b.subscriptionExpiresAt.seconds * 1000
              : new Date(b.subscriptionExpiresAt || 0).getTime();
            return tB - tA;
          });

          setSubscribers(list);
          setLoading(false);
        },
        (error) => {
          console.warn('Snapshot listener restrito, usando fallback via API:', error.message);
        }
      );
    } catch (e) {
      console.warn('Erro ao registrar snapshot de assinantes:', e);
    }

    return () => {
      isMounted = false;
      unsubscribeSnapshot?.();
    };
  }, []);

  // Métricas calculadas no topo
  const metrics = useMemo(() => {
    let totalSubscribers = 0;
    let proCount = 0;
    let graficaCount = 0;
    let cardCount = 0;
    let pixCount = 0;
    let totalAvailableCredits = 0;

    subscribers.forEach((s) => {
      if (s.isSubscriber) {
        totalSubscribers++;
        totalAvailableCredits += s.availableCredits || 0;

        if (s.subscriptionPlan === 'grafica') graficaCount++;
        else proCount++;

        if (s.subscriptionMethod === 'pix') pixCount++;
        else cardCount++;
      }
    });

    return {
      totalSubscribers,
      proCount,
      graficaCount,
      cardCount,
      pixCount,
      totalAvailableCredits,
    };
  }, [subscribers]);

  // Filtro de assinantes
  const filteredSubscribers = useMemo(() => {
    return subscribers.filter((s) => {
      const matchSearch =
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.phone && s.phone.includes(searchTerm)) ||
        (s.cpf && s.cpf.includes(searchTerm)) ||
        (s.subscriptionId && s.subscriptionId.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchPlan = planFilter === 'todos' || s.subscriptionPlan === planFilter;
      const matchMethod = methodFilter === 'todos' || s.subscriptionMethod === methodFilter;
      const matchStatus = statusFilter === 'todos' || s.subscriptionStatus === statusFilter;

      return matchSearch && matchPlan && matchMethod && matchStatus;
    });
  }, [subscribers, searchTerm, planFilter, methodFilter, statusFilter]);

  // Função para executar ajuste atômico de créditos
  const handleCreditAdjustment = async (
    userId: string,
    action: 'add' | 'subtract' | 'set',
    amount: number
  ) => {
    setIsAdjustingCredits(true);
    setFeedbackMessage(null);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('Administrador não autenticado.');

      const res = await fetch('/api/admin/assinantes/credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, action, amount }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao ajustar créditos');

      // Atualiza o estado local imediatamente
      setSubscribers((prev) =>
        prev.map((sub) =>
          sub.uid === userId ? { ...sub, availableCredits: data.newCredits } : sub
        )
      );

      // Se o modal estiver aberto para esse usuário, atualiza a referência
      if (creditModalUser && creditModalUser.uid === userId) {
        setCreditModalUser({ ...creditModalUser, availableCredits: data.newCredits });
      }
      if (selectedSubscriber && selectedSubscriber.uid === userId) {
        setSelectedSubscriber({ ...selectedSubscriber, availableCredits: data.newCredits });
      }

      setFeedbackMessage({
        type: 'success',
        text: `Créditos atualizados com sucesso: ${data.newCredits} créditos.`,
      });
      setCustomCreditInput('');
    } catch (err: any) {
      setFeedbackMessage({
        type: 'error',
        text: err?.message || 'Erro ao atualizar créditos.',
      });
    } finally {
      setIsAdjustingCredits(false);
    }
  };

  const handleManualRefresh = async () => {
    setLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;
      const res = await fetch('/api/admin/assinantes', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.assinantes)) {
          setSubscribers(data.assinantes);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 space-y-8">
      {/* ══════════════════════════════════════════════════════════════════
          1. CARDS DE RESUMO NO TOPO
      ══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total de Assinantes Ativos */}
        <div className="bg-[#111111] border border-white/5 rounded-3xl p-6 relative overflow-hidden group hover:border-[#fe7302]/30 transition-all">
          <div className="absolute top-0 right-0 w-28 h-28 bg-[#fe7302]/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">
              Assinantes Ativos
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#fe7302]/10 border border-[#fe7302]/20 flex items-center justify-center text-[#fe7302]">
              <Crown size={18} />
            </div>
          </div>
          <p className="text-3xl font-black text-white tracking-tight">
            {metrics.totalSubscribers}
          </p>
          <p className="text-[10px] text-gray-500 font-medium mt-1">
            Membros com assinatura ou passe ativo
          </p>
        </div>

        {/* Card 2: Contagem por Plano */}
        <div className="bg-[#111111] border border-white/5 rounded-3xl p-6 relative overflow-hidden group hover:border-white/10 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">
              Por Plano
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Layers size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#fe7302]" />
              <span className="text-lg font-black text-white">{metrics.proCount}</span>
              <span className="text-[11px] text-gray-400 font-bold uppercase">PRO</span>
            </div>
            <span className="text-gray-700">|</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              <span className="text-lg font-black text-white">{metrics.graficaCount}</span>
              <span className="text-[11px] text-gray-400 font-bold uppercase">Gráfica</span>
            </div>
          </div>
          <p className="text-[10px] text-gray-500 font-medium mt-1">
            {metrics.proCount} no Clube PRO (15) · {metrics.graficaCount} na Gráfica (40)
          </p>
        </div>

        {/* Card 3: Contagem por Tipo de Cobrança */}
        <div className="bg-[#111111] border border-white/5 rounded-3xl p-6 relative overflow-hidden group hover:border-white/10 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">
              Forma de Cobrança
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <CreditCard size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-3">
            <div className="flex items-center gap-1.5">
              <CreditCard size={12} className="text-blue-400" />
              <span className="text-lg font-black text-white">{metrics.cardCount}</span>
              <span className="text-[11px] text-gray-400 font-bold uppercase">Cartão</span>
            </div>
            <span className="text-gray-700">|</span>
            <div className="flex items-center gap-1.5">
              <QrCode size={12} className="text-emerald-400" />
              <span className="text-lg font-black text-white">{metrics.pixCount}</span>
              <span className="text-[11px] text-gray-400 font-bold uppercase">Pix</span>
            </div>
          </div>
          <p className="text-[10px] text-gray-500 font-medium mt-1">
            {metrics.cardCount} recorrentes · {metrics.pixCount} passes 30 dias
          </p>
        </div>

        {/* Card 4: Total de Créditos Disponíveis */}
        <div className="bg-[#111111] border border-white/5 rounded-3xl p-6 relative overflow-hidden group hover:border-emerald-500/30 transition-all">
          <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">
              Créditos em Circulação
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Sparkles size={18} />
            </div>
          </div>
          <p className="text-3xl font-black text-emerald-400 tracking-tight">
            {metrics.totalAvailableCredits}
          </p>
          <p className="text-[10px] text-gray-500 font-medium mt-1">
            Total de downloads disponíveis nas contas
          </p>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          2. BARRA DE BUSCA E FILTROS
      ══════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Campo de Busca Rápida */}
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar por nome, e-mail, CPF ou ID da assinatura..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-[#111111] border border-white/5 rounded-2xl text-[12px] text-white placeholder-gray-600 focus:outline-none focus:border-[#fe7302]/40 transition-colors"
          />
        </div>

        {/* Filtros em Pílulas */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Filtro de Plano */}
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value as any)}
            className="bg-[#111111] border border-white/5 text-gray-300 text-[11px] font-bold uppercase rounded-xl px-3 py-2.5 outline-none focus:border-[#fe7302]/40"
          >
            <option value="todos">Todos os Planos</option>
            <option value="pro">Clube PRO</option>
            <option value="grafica">Plano Gráfica</option>
          </select>

          {/* Filtro de Método */}
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value as any)}
            className="bg-[#111111] border border-white/5 text-gray-300 text-[11px] font-bold uppercase rounded-xl px-3 py-2.5 outline-none focus:border-[#fe7302]/40"
          >
            <option value="todos">Todas as Formas</option>
            <option value="card">Cartão Recorrente</option>
            <option value="pix">PIX (Passe 30d)</option>
          </select>

          {/* Filtro de Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-[#111111] border border-white/5 text-gray-300 text-[11px] font-bold uppercase rounded-xl px-3 py-2.5 outline-none focus:border-[#fe7302]/40"
          >
            <option value="todos">Todos os Status</option>
            <option value="active">Ativo</option>
            <option value="paused">Pausado</option>
            <option value="canceled">Cancelado</option>
          </select>

          {/* Botão de Atualização Manual */}
          <button
            onClick={handleManualRefresh}
            disabled={loading}
            title="Atualizar lista"
            className="p-2.5 bg-[#111111] border border-white/5 rounded-xl text-gray-400 hover:text-white hover:border-white/10 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          3. TABELA / LISTA DE ASSINANTES
      ══════════════════════════════════════════════════════════════════ */}
      {loading && subscribers.length === 0 ? (
        <div className="text-center py-24 text-gray-500">
          <Loader2 size={32} className="animate-spin text-[#fe7302] mx-auto mb-3" />
          <p className="text-xs font-bold uppercase tracking-widest">Carregando assinantes...</p>
        </div>
      ) : filteredSubscribers.length === 0 ? (
        <div className="text-center py-20 bg-[#111111] border border-white/5 rounded-3xl p-8 text-gray-500">
          <Crown size={40} className="mx-auto mb-3 text-gray-600 opacity-40" />
          <p className="text-sm font-bold text-gray-300">Nenhum assinante encontrado</p>
          <p className="text-xs text-gray-600 mt-1">
            {searchTerm ? 'Tente ajustar os filtros ou a busca' : 'Ainda não há membros cadastrados no Clube de Assinantes'}
          </p>
        </div>
      ) : (
        <div className="bg-[#111111] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 bg-black/20">
                  <th className="py-4 px-6">Cliente</th>
                  <th className="py-4 px-4">Plano</th>
                  <th className="py-4 px-4">Método</th>
                  <th className="py-4 px-4">Créditos</th>
                  <th className="py-4 px-4">Expiração / Renovação</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {filteredSubscribers.map((sub) => {
                  const isPro = sub.subscriptionPlan === 'pro';
                  const isPix = sub.subscriptionMethod === 'pix';
                  const downloadCount = (sub.downloadHistory || []).length;

                  return (
                    <tr
                      key={sub.uid}
                      className="hover:bg-white/[0.02] transition-colors group"
                    >
                      {/* Cliente */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#fe7302]/20 to-purple-500/20 border border-white/10 flex items-center justify-center text-white font-black text-sm shrink-0 overflow-hidden">
                            {sub.photoURL ? (
                              <img
                                src={sub.photoURL}
                                alt={sub.name}
                                className="w-full h-full object-cover rounded-2xl"
                              />
                            ) : (
                              sub.name.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[13px] font-extrabold text-white truncate flex items-center gap-1.5">
                              {sub.name}
                            </p>
                            <p className="text-[11px] text-gray-500 truncate mt-0.5">{sub.email}</p>
                            {(sub.phone || sub.cpf) && (
                              <div className="flex items-center gap-2 mt-1 text-[9px] text-gray-600 font-mono">
                                {sub.phone && (
                                  <a
                                    href={`https://wa.me/55${sub.phone.replace(/\D/g, '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:text-emerald-400 flex items-center gap-1 transition-colors"
                                    title="Chamar no WhatsApp"
                                  >
                                    <Phone size={10} /> {sub.phone}
                                  </a>
                                )}
                                {sub.cpf && <span>• CPF: {sub.cpf}</span>}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Plano */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            isPro
                              ? 'bg-[#fe7302]/10 border border-[#fe7302]/30 text-[#fe7302]'
                              : 'bg-purple-500/10 border border-purple-500/30 text-purple-400'
                          }`}
                        >
                          <Crown size={11} />
                          {isPro ? 'Clube PRO' : 'Plano Gráfica'}
                        </span>
                      </td>

                      {/* Método */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider ${
                            isPix
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          }`}
                        >
                          {isPix ? (
                            <>
                              <QrCode size={11} /> Pix (30d)
                            </>
                          ) : (
                            <>
                              <CreditCard size={11} /> Cartão Recorrente
                            </>
                          )}
                        </span>
                      </td>

                      {/* Saldo de Créditos */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-black tabular-nums ${
                              sub.availableCredits > 0
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-red-500/10 text-red-400 border border-red-500/20'
                            }`}
                          >
                            <Sparkles size={11} />
                            {sub.availableCredits}{' '}
                            <span className="text-[10px] font-medium opacity-70">
                              / {sub.monthlyCredits}
                            </span>
                          </span>

                          {/* Botão rápido para ajustar créditos */}
                          <button
                            onClick={() => {
                              setCreditModalUser(sub);
                              setCustomCreditInput(String(sub.availableCredits));
                              setFeedbackMessage(null);
                            }}
                            className="p-1 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
                            title="Gerenciar créditos manualmente"
                          >
                            <Edit2 size={12} />
                          </button>
                        </div>
                      </td>

                      {/* Expiração / Renovação */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="text-[11px] font-semibold text-gray-300">
                          {formatDate(sub.subscriptionExpiresAt)}
                        </div>
                        <div className="text-[9px] text-gray-500 uppercase tracking-wider mt-0.5">
                          {isPix ? 'Término do passe' : 'Próxima cobrança'}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                            sub.subscriptionStatus === 'active'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : sub.subscriptionStatus === 'paused'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          {sub.subscriptionStatus === 'active'
                            ? 'Ativo'
                            : sub.subscriptionStatus === 'paused'
                            ? 'Pausado'
                            : 'Cancelado'}
                        </span>
                      </td>

                      {/* Ações */}
                      <td className="py-4 px-6 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Botão Ver Downloads */}
                          <button
                            onClick={() => setSelectedSubscriber(sub)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-[#fe7302] hover:text-white text-gray-300 text-[11px] font-bold transition-all border border-white/5"
                            title="Ver histórico de downloads do assinante"
                          >
                            <Download size={12} />
                            <span>Downloads</span>
                            {downloadCount > 0 && (
                              <span className="ml-0.5 px-1.5 py-0.2 rounded-md bg-white/10 text-[9px] font-mono">
                                {downloadCount}
                              </span>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Rodapé da Tabela */}
          <div className="p-4 bg-black/20 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-500 font-bold uppercase tracking-wider">
            <span>
              Exibindo {filteredSubscribers.length} de {subscribers.length} assinantes
            </span>
            <span>Atualização em tempo real sincronizada</span>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          4. MODAL: HISTÓRICO DE DOWNLOADS DO ASSINANTE
      ══════════════════════════════════════════════════════════════════ */}
      {selectedSubscriber && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-2xl bg-[#111111] border border-white/10 rounded-3xl overflow-hidden shadow-2xl my-auto animate-in fade-in zoom-in-95 duration-200">
            {/* Cabeçalho do Modal */}
            <div className="p-6 border-b border-white/5 bg-black/30 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#fe7302]/10 border border-[#fe7302]/20 flex items-center justify-center text-[#fe7302] font-black text-base shrink-0 overflow-hidden">
                  {selectedSubscriber.photoURL ? (
                    <img
                      src={selectedSubscriber.photoURL}
                      alt={selectedSubscriber.name}
                      className="w-full h-full object-cover rounded-2xl"
                    />
                  ) : (
                    selectedSubscriber.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-white">{selectedSubscriber.name}</h3>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#fe7302]/10 text-[#fe7302] border border-[#fe7302]/20">
                      {selectedSubscriber.subscriptionPlan === 'grafica'
                        ? 'Plano Gráfica'
                        : 'Clube PRO'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{selectedSubscriber.email}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedSubscriber(null)}
                className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Resumo Rápido */}
            <div className="grid grid-cols-3 gap-2 p-5 bg-black/10 border-b border-white/5 text-center text-xs">
              <div className="p-3 bg-white/[0.02] rounded-2xl border border-white/5">
                <span className="text-[10px] text-gray-500 uppercase font-black tracking-wider block mb-1">
                  Saldo de Créditos
                </span>
                <span className="text-base font-black text-emerald-400">
                  {selectedSubscriber.availableCredits} de {selectedSubscriber.monthlyCredits}
                </span>
              </div>
              <div className="p-3 bg-white/[0.02] rounded-2xl border border-white/5">
                <span className="text-[10px] text-gray-500 uppercase font-black tracking-wider block mb-1">
                  Total Resgatado
                </span>
                <span className="text-base font-black text-white">
                  {(selectedSubscriber.downloadHistory || []).length} artes
                </span>
              </div>
              <div className="p-3 bg-white/[0.02] rounded-2xl border border-white/5">
                <span className="text-[10px] text-gray-500 uppercase font-black tracking-wider block mb-1">
                  Validade / Ciclo
                </span>
                <span className="text-base font-black text-purple-400">
                  {formatDate(selectedSubscriber.subscriptionExpiresAt)}
                </span>
              </div>
            </div>

            {/* Lista de Downloads do Assinante */}
            <div className="p-6 max-h-[50vh] overflow-y-auto space-y-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2">
                  <Download size={13} className="text-[#fe7302]" /> Histórico de Resgates
                </h4>
                <span className="text-[10px] text-gray-600 font-mono">
                  {(selectedSubscriber.downloadHistory || []).length} resgates registrados
                </span>
              </div>

              {(!selectedSubscriber.downloadHistory ||
                selectedSubscriber.downloadHistory.length === 0) ? (
                <div className="text-center py-12 text-gray-500">
                  <Download size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="text-xs font-bold text-gray-400">Nenhum download registrado ainda</p>
                  <p className="text-[11px] text-gray-600 mt-1">
                    Este assinante ainda não resgatou nenhum vetor com seus créditos.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedSubscriber.downloadHistory.map((item, idx) => {
                    const prod = productMap.get(item.productId);
                    const thumb =
                      prod?.urls?.destaque ||
                      prod?.urls?.capa ||
                      prod?.image ||
                      '/icon.png';
                    const title = prod?.name || `Produto ID: ${item.productId}`;
                    const formats = prod?.formats || ['CDR', 'PDF'];

                    return (
                      <div
                        key={`${item.productId}-${idx}`}
                        className="bg-[#18181b] border border-white/5 rounded-2xl p-3.5 flex items-center gap-3.5 hover:border-white/10 transition-colors"
                      >
                        {/* Imagem do Produto */}
                        <div className="w-14 h-14 rounded-xl bg-black/40 border border-white/5 shrink-0 overflow-hidden relative">
                          <img
                            src={thumb}
                            alt={title}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Detalhes */}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-white truncate">{title}</p>
                          <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400">
                            <span className="flex items-center gap-1 font-mono">
                              <Calendar size={11} className="text-gray-500" />
                              {formatDateTime(item.downloadedAt)}
                            </span>
                            <span>•</span>
                            <span
                              className={`font-semibold ${
                                item.method === 'credit'
                                  ? 'text-[#fe7302]'
                                  : 'text-emerald-400'
                              }`}
                            >
                              {item.method === 'credit' ? '1 Crédito PRO' : 'Compra Direta'}
                            </span>
                          </div>

                          {/* Formatos do Vetor */}
                          <div className="flex items-center gap-1 mt-1.5">
                            {formats.map((fmt: string) => (
                              <span
                                key={fmt}
                                className="px-1.5 py-0.5 rounded bg-white/5 text-[9px] font-bold text-gray-400 font-mono"
                              >
                                .{fmt}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Link externo para a página do produto */}
                        {prod && (
                          <a
                            href={`/product/${prod.slug || prod.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-xl text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
                            title="Abrir página do produto"
                          >
                            <ExternalLink size={14} />
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Rodapé do Modal */}
            <div className="p-4 bg-black/30 border-t border-white/5 flex items-center justify-between">
              <button
                onClick={() => {
                  const sub = selectedSubscriber;
                  setSelectedSubscriber(null);
                  setCreditModalUser(sub);
                  setCustomCreditInput(String(sub.availableCredits));
                }}
                className="text-xs font-bold text-[#fe7302] hover:underline flex items-center gap-1.5"
              >
                <Edit2 size={13} /> Gerenciar créditos deste assinante
              </button>
              <button
                onClick={() => setSelectedSubscriber(null)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          5. MODAL: GERENCIAMENTO MANUAL DE CRÉDITOS
      ══════════════════════════════════════════════════════════════════ */}
      {creditModalUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-md bg-[#111111] border border-white/10 rounded-3xl p-6 overflow-hidden shadow-2xl my-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-white/5">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#fe7302] flex items-center gap-1.5">
                  <Sparkles size={12} /> Ajuste Atômico de Créditos
                </span>
                <h3 className="text-base font-black text-white mt-0.5">
                  {creditModalUser.name}
                </h3>
                <p className="text-xs text-gray-500">{creditModalUser.email}</p>
              </div>
              <button
                onClick={() => {
                  setCreditModalUser(null);
                  setFeedbackMessage(null);
                }}
                className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Saldo Atual */}
            <div className="my-6 p-4 rounded-2xl bg-black/40 border border-white/5 text-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1">
                Saldo Atual de Downloads
              </span>
              <span className="text-4xl font-black text-emerald-400 tracking-tight">
                {creditModalUser.availableCredits}
              </span>
              <span className="text-xs text-gray-500 block mt-1">
                Cota contratada: {creditModalUser.monthlyCredits} downloads por ciclo
              </span>
            </div>

            {feedbackMessage && (
              <div
                className={`mb-4 p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                  feedbackMessage.type === 'success'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-red-500/10 text-red-400 border border-red-500/20'
                }`}
              >
                <AlertCircle size={14} className="shrink-0" />
                <span>{feedbackMessage.text}</span>
              </div>
            )}

            {/* Botões de Ações Rápidas */}
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-2">
                  Ações Rápidas (+ / -)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  <button
                    disabled={isAdjustingCredits}
                    onClick={() => handleCreditAdjustment(creditModalUser.uid, 'add', 1)}
                    className="py-2.5 rounded-xl bg-white/5 hover:bg-emerald-500 hover:text-white text-emerald-400 border border-emerald-500/20 text-xs font-black transition-all flex items-center justify-center gap-1 disabled:opacity-50"
                  >
                    <Plus size={12} /> 1
                  </button>
                  <button
                    disabled={isAdjustingCredits}
                    onClick={() => handleCreditAdjustment(creditModalUser.uid, 'add', 5)}
                    className="py-2.5 rounded-xl bg-white/5 hover:bg-emerald-500 hover:text-white text-emerald-400 border border-emerald-500/20 text-xs font-black transition-all flex items-center justify-center gap-1 disabled:opacity-50"
                  >
                    <Plus size={12} /> 5
                  </button>
                  <button
                    disabled={isAdjustingCredits || creditModalUser.availableCredits <= 0}
                    onClick={() => handleCreditAdjustment(creditModalUser.uid, 'subtract', 1)}
                    className="py-2.5 rounded-xl bg-white/5 hover:bg-red-500 hover:text-white text-red-400 border border-red-500/20 text-xs font-black transition-all flex items-center justify-center gap-1 disabled:opacity-50"
                  >
                    <Minus size={12} /> 1
                  </button>
                  <button
                    disabled={isAdjustingCredits || creditModalUser.availableCredits <= 0}
                    onClick={() => handleCreditAdjustment(creditModalUser.uid, 'subtract', 5)}
                    className="py-2.5 rounded-xl bg-white/5 hover:bg-red-500 hover:text-white text-red-400 border border-red-500/20 text-xs font-black transition-all flex items-center justify-center gap-1 disabled:opacity-50"
                  >
                    <Minus size={12} /> 5
                  </button>
                </div>
              </div>

              {/* Definir Valor Exato */}
              <div className="pt-2 border-t border-white/5">
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-2">
                  Definir Saldo Exato
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    placeholder="Ex: 15"
                    value={customCreditInput}
                    onChange={(e) => setCustomCreditInput(e.target.value)}
                    className="flex-1 px-4 py-2.5 bg-black/50 border border-white/10 rounded-xl text-sm font-bold text-white placeholder-gray-600 focus:outline-none focus:border-[#fe7302]"
                  />
                  <button
                    disabled={isAdjustingCredits || customCreditInput === ''}
                    onClick={() => {
                      const val = parseInt(customCreditInput, 10);
                      if (!isNaN(val) && val >= 0) {
                        handleCreditAdjustment(creditModalUser.uid, 'set', val);
                      }
                    }}
                    className="px-5 py-2.5 rounded-xl bg-[#fe7302] hover:bg-[#e56700] text-white text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isAdjustingCredits ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Check size={14} />
                    )}
                    Salvar
                  </button>
                </div>
              </div>
            </div>

            {/* Fechar */}
            <div className="mt-6 pt-4 border-t border-white/5 text-right">
              <button
                onClick={() => {
                  setCreditModalUser(null);
                  setFeedbackMessage(null);
                }}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
