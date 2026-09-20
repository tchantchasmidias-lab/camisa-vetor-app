'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { 
  ArrowLeft, ArrowRight, RotateCw, X as CloseIcon, Home, Star,
  ExternalLink, Globe, Lock, CheckCircle2, Heart, MessageCircle,
  Play, Share2, ThumbsUp, Bookmark, Search, Eye
} from 'lucide-react';
import type { Product } from '@/components/HomeClient';

export type SocialNetwork = 'instagram' | 'tiktok' | 'youtube' | 'pinterest' | 'linkedin';

export interface SocialNetworkConfig {
  id: SocialNetwork;
  name: string;
  url: string;
  image: string;
  handle: string;
  windowTitle: string;
  themeColor: string;
}

export const SOCIAL_NETWORKS_CONFIG: Record<SocialNetwork, SocialNetworkConfig> = {
  instagram: {
    id: 'instagram',
    name: 'Instagram',
    url: 'https://www.instagram.com/camisavetor',
    image: '/Instagram.png',
    handle: '@camisavetor',
    windowTitle: 'Instagram - Camisa Vetor',
    themeColor: '#E1306C',
  },
  tiktok: {
    id: 'tiktok',
    name: 'TikTok',
    url: 'https://www.tiktok.com/@camisavetor',
    image: '/tiktok.png',
    handle: '@camisavetor',
    windowTitle: 'TikTok - Camisa Vetor',
    themeColor: '#00F2FE',
  },
  youtube: {
    id: 'youtube',
    name: 'YouTube',
    url: 'https://www.youtube.com/@CAMISAVETOR',
    image: '/youtube.png',
    handle: '@CAMISAVETOR',
    windowTitle: 'YouTube - Camisa Vetor',
    themeColor: '#FF0000',
  },
  pinterest: {
    id: 'pinterest',
    name: 'Pinterest',
    url: 'https://br.pinterest.com/camisavetor/',
    image: '/Pinterest.png',
    handle: '@camisavetor',
    windowTitle: 'Pinterest - Camisa Vetor',
    themeColor: '#E60023',
  },
  linkedin: {
    id: 'linkedin',
    name: 'LinkedIn',
    url: 'https://www.linkedin.com/in/camisavetor/',
    image: '/LinkedIn.png',
    handle: 'camisavetor',
    windowTitle: 'LinkedIn - Camisa Vetor',
    themeColor: '#0A66C2',
  },
};

interface XPBrowserProps {
  currentNetwork: SocialNetwork;
  onNavigateNetwork: (network: SocialNetwork) => void;
  onPlayClick: () => void;
  products: Product[];
}

export default function XPBrowser({
  currentNetwork,
  onNavigateNetwork,
  onPlayClick,
  products,
}: XPBrowserProps) {
  const config = SOCIAL_NETWORKS_CONFIG[currentNetwork] || SOCIAL_NETWORKS_CONFIG.instagram;
  const [addressInput, setAddressInput] = useState(config.url);
  const [isLoading, setIsLoading] = useState(false);

  // Sincroniza o input quando a rede atual mudar externamente
  React.useEffect(() => {
    setAddressInput(config.url);
  }, [config.url]);

  // Simula recarregamento retrô da página
  const handleRefresh = () => {
    onPlayClick();
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 400);
  };

  // Abrir no navegador real
  const handleOpenExternal = () => {
    onPlayClick();
    window.open(config.url, '_blank', 'noopener,noreferrer');
  };

  const handleSelectNetwork = (net: SocialNetwork) => {
    onPlayClick();
    onNavigateNetwork(net);
  };

  // Primeiros produtos para preencher os feeds simulados
  const showcaseProducts = products.slice(0, 9);

  return (
    <div className="flex flex-col h-full bg-[#ece9d8] text-[#202124] select-none font-sans overflow-hidden">
      {/* ── BARRA DE MENUS RETRÔ DO INTERNET EXPLORER ── */}
      <div className="bg-[#ece9d8] border-b border-[#d4d0c8] px-2 py-0.5 flex items-center gap-3 text-[11px] text-[#222222] shrink-0">
        {['Arquivo', 'Editar', 'Exibir', 'Favoritos', 'Ferramentas', 'Ajuda'].map(item => (
          <span
            key={item}
            className="px-1.5 py-0.5 hover:bg-[#316ac5] hover:text-white rounded-[2px] cursor-default transition-colors"
          >
            {item}
          </span>
        ))}
      </div>

      {/* ── BARRA DE FERRAMENTAS PADRÃO DO IE ── */}
      <div className="bg-[#ece9d8] border-b border-[#d4d0c8] px-2 py-1 flex items-center justify-between gap-1 text-xs shrink-0">
        <div className="flex items-center gap-1">
          {/* Voltar */}
          <button 
            onClick={onPlayClick}
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-white/60 active:bg-black/10 text-gray-700 disabled:opacity-40"
            title="Voltar"
          >
            <div className="w-5 h-5 rounded-full bg-gradient-to-b from-[#7ebb52] to-[#458b22] text-white flex items-center justify-center shadow-xs">
              <ArrowLeft size={13} strokeWidth={2.5} />
            </div>
            <span className="hidden sm:inline text-[11px]">Voltar</span>
          </button>

          {/* Avançar */}
          <button 
            onClick={onPlayClick}
            className="flex items-center gap-1 px-1.5 py-1 rounded hover:bg-white/60 active:bg-black/10 text-gray-700 opacity-40"
            title="Avançar"
          >
            <div className="w-5 h-5 rounded-full bg-gradient-to-b from-[#7ebb52] to-[#458b22] text-white flex items-center justify-center shadow-xs">
              <ArrowRight size={13} strokeWidth={2.5} />
            </div>
          </button>

          {/* Parar */}
          <button 
            onClick={onPlayClick}
            className="flex items-center gap-1 px-1.5 py-1 rounded hover:bg-white/60 text-gray-700"
            title="Parar"
          >
            <CloseIcon size={14} className="text-[#c4101d]" />
            <span className="hidden sm:inline text-[11px]">Parar</span>
          </button>

          {/* Atualizar */}
          <button 
            onClick={handleRefresh}
            className="flex items-center gap-1 px-1.5 py-1 rounded hover:bg-white/60 text-gray-700"
            title="Atualizar"
          >
            <RotateCw size={13} className={`text-[#458b22] ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline text-[11px]">Atualizar</span>
          </button>

          {/* Página Inicial */}
          <button 
            onClick={() => handleSelectNetwork('instagram')}
            className="flex items-center gap-1 px-1.5 py-1 rounded hover:bg-white/60 text-gray-700"
            title="Página Inicial"
          >
            <Home size={14} className="text-[#0055ea]" />
            <span className="hidden sm:inline text-[11px]">Início</span>
          </button>

          <div className="w-px h-5 bg-gray-300 mx-1 hidden sm:block" />

          {/* Favoritos */}
          <button 
            onClick={onPlayClick}
            className="hidden sm:flex items-center gap-1 px-1.5 py-1 rounded hover:bg-white/60 text-gray-700"
            title="Favoritos"
          >
            <Star size={14} className="text-[#f5a623] fill-[#f5a623]" />
            <span className="text-[11px]">Favoritos</span>
          </button>
        </div>

        {/* Logotipo Clássico do Windows / Internet Explorer animado */}
        <div className="w-7 h-7 rounded border border-gray-400 bg-gradient-to-b from-[#1b5dc6] to-[#083b8b] flex items-center justify-center shadow-inner shrink-0 group">
          <Globe size={18} className="text-white animate-spin-slow group-hover:rotate-180 transition-transform duration-700" />
        </div>
      </div>

      {/* ── BARRA DE ENDEREÇOS RETRÔ ── */}
      <div className="bg-[#ece9d8] border-b border-[#d4d0c8] px-2 py-1 flex items-center gap-2 text-xs shrink-0">
        <span className="text-gray-600 font-medium shrink-0 text-[11px]">Endereço</span>
        <div className="flex-1 flex items-center gap-1.5 bg-white border border-[#7f9db9] px-2 py-0.5 rounded shadow-inner overflow-hidden">
          <div className="w-4 h-4 relative shrink-0">
            <Image
              src={config.image}
              alt={config.name}
              width={16}
              height={16}
              className="object-contain"
            />
          </div>
          <input
            type="text"
            value={addressInput}
            onChange={e => setAddressInput(e.target.value)}
            className="w-full bg-transparent text-xs font-mono text-slate-800 outline-none truncate"
          />
        </div>

        {/* Botão Ir */}
        <button
          onClick={handleRefresh}
          className="px-2.5 py-0.5 bg-gradient-to-b from-[#f2f0e4] to-[#ece9d8] hover:brightness-105 border border-[#7f9db9] rounded text-[11px] font-bold text-gray-800 active:brightness-95 flex items-center gap-1 shadow-xs"
        >
          <span className="text-[#458b22]">➔</span>
          <span>Ir</span>
        </button>

        {/* Botão Abrir em Nova Aba (Externo) */}
        <button
          onClick={handleOpenExternal}
          className="px-2.5 py-0.5 bg-gradient-to-b from-[#0058e6] to-[#0047ba] hover:brightness-110 border border-[#003da8] rounded text-[11px] font-bold text-white active:brightness-95 flex items-center gap-1.5 shadow-sm shrink-0 cursor-pointer"
          title="Abrir este perfil no navegador real em uma nova aba"
        >
          <span>Abrir em nova aba</span>
          <ExternalLink size={12} strokeWidth={2.5} />
        </button>
      </div>

      {/* ── BARRA DE LINKS / ATALHOS RÁPIDOS (FAVORITOS DE REDES SOCIAIS) ── */}
      <div className="bg-[#f0eee0] border-b border-[#d4d0c8] px-2 py-1 flex items-center gap-1 text-[11px] overflow-x-auto shrink-0 scrollbar-none">
        <span className="text-gray-500 font-semibold text-[10px] mr-1 shrink-0">Links:</span>
        {(Object.keys(SOCIAL_NETWORKS_CONFIG) as SocialNetwork[]).map(netKey => {
          const item = SOCIAL_NETWORKS_CONFIG[netKey];
          const isActive = currentNetwork === netKey;
          return (
            <button
              key={netKey}
              onClick={() => handleSelectNetwork(netKey)}
              className={`flex items-center gap-1 px-2 py-0.5 rounded border transition-all shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-white border-[#316ac5] shadow-xs text-blue-900 font-bold'
                  : 'border-transparent hover:bg-white/70 text-gray-700'
              }`}
              title={`Ir para ${item.name}`}
            >
              <div className="w-3.5 h-3.5 relative">
                <Image src={item.image} alt={item.name} width={14} height={14} className="object-contain" />
              </div>
              <span>{item.name}</span>
            </button>
          );
        })}
      </div>

      {/* ── CORPO DA PÁGINA (PREVIEW SIMULADO DA REDE SOCIAL) ── */}
      <div className="flex-1 bg-white overflow-y-auto relative">
        {isLoading ? (
          <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center gap-3 z-30">
            <RotateCw size={32} className="text-[#0055ea] animate-spin" />
            <p className="text-xs text-gray-600 font-medium font-sans">Carregando {config.name}...</p>
          </div>
        ) : null}

        {/* 1. INSTAGRAM PREVIEW */}
        {currentNetwork === 'instagram' && (
          <div className="max-w-3xl mx-auto p-4 sm:p-6 text-slate-800">
            {/* Topo do Perfil Instagram */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 border-b border-gray-200 pb-6">
              {/* Avatar com Story Ring */}
              <div className="relative p-1 rounded-full bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] shadow-md shrink-0">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-white p-1 overflow-hidden flex items-center justify-center">
                  <Image src="/Instagram.png" alt="Camisa Vetor" width={90} height={90} className="object-contain" />
                </div>
              </div>

              {/* Informações do Perfil */}
              <div className="flex-1 text-center sm:text-left space-y-3">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                  <h1 className="text-xl font-bold text-slate-900">camisavetor</h1>
                  <CheckCircle2 size={18} className="text-sky-500 fill-sky-500 text-white" />
                  <button 
                    onClick={handleOpenExternal}
                    className="px-4 py-1.5 bg-[#0095f6] hover:bg-[#1877f2] text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
                  >
                    Seguir no Instagram
                  </button>
                  <button 
                    onClick={handleOpenExternal}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-xs font-bold text-slate-800 rounded-lg transition-colors cursor-pointer"
                  >
                    Enviar mensagem
                  </button>
                </div>

                {/* Estatísticas */}
                <div className="flex justify-center sm:justify-start gap-6 text-xs text-slate-700">
                  <span><strong>1.480</strong> publicações</span>
                  <span><strong>28,4 mil</strong> seguidores</span>
                  <span><strong>412</strong> seguindo</span>
                </div>

                {/* Bio */}
                <div className="text-xs text-slate-700 leading-relaxed space-y-1">
                  <p className="font-bold text-slate-900">Camisa Vetor • Estampas & Vetores CorelDRAW</p>
                  <p>👕 Artes 100% editáveis em (.CDR e .PDF) para sublimação digital</p>
                  <p>🎣 Pesca Esportiva • 🐎 Cavalgada • ⚽ Interclasse • 🙏 Gospel / Cristã</p>
                  <p>⚡ Download imediato liberado no pix e cartão</p>
                  <a 
                    href="https://camisavetor.com.br" 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-[#00376b] font-bold hover:underline flex items-center gap-1 mt-1"
                  >
                    🔗 camisavetor.com.br
                  </a>
                </div>
              </div>
            </div>

            {/* Destaques (Stories Highlights) */}
            <div className="flex items-center gap-4 sm:gap-6 py-4 border-b border-gray-100 overflow-x-auto">
              {[
                { name: 'Novidades', icon: '🔥' },
                { name: 'Pesca', icon: '🎣' },
                { name: 'Cavalgada', icon: '🐎' },
                { name: 'Interclasse', icon: '⚽' },
                { name: 'Gospel', icon: '🙏' },
                { name: 'Clientes', icon: '⭐' },
              ].map(h => (
                <div key={h.name} className="flex flex-col items-center gap-1 shrink-0 cursor-pointer group">
                  <div className="w-14 h-14 rounded-full border-2 border-gray-300 p-0.5 group-hover:border-pink-500 transition-colors flex items-center justify-center bg-gray-50 text-xl shadow-xs">
                    {h.icon}
                  </div>
                  <span className="text-[11px] text-gray-700 font-medium">{h.name}</span>
                </div>
              ))}
            </div>

            {/* Grade de Publicações */}
            <div className="pt-4">
              <div className="flex items-center justify-center gap-8 text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 border-t border-gray-100 pt-2">
                <span className="text-slate-900 border-t-2 border-slate-900 pt-1 -mt-2.5">Publicações</span>
                <span className="hover:text-slate-800 cursor-pointer">Reels</span>
                <span className="hover:text-slate-800 cursor-pointer">Marcados</span>
              </div>

              <div className="grid grid-cols-3 gap-1.5 sm:gap-3">
                {showcaseProducts.map(p => (
                  <div 
                    key={p.id}
                    onClick={handleOpenExternal}
                    className="group relative aspect-square bg-gray-100 rounded overflow-hidden cursor-pointer shadow-xs"
                  >
                    {p.urls?.capa ? (
                      <Image
                        src={p.urls.capa}
                        alt={p.name}
                        fill
                        className="object-contain p-2 group-hover:scale-105 transition-transform"
                        sizes="(max-width: 768px) 30vw, 220px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">Vetor</div>
                    )}
                    {/* Overlay com likes no hover */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white font-bold text-xs">
                      <div className="flex items-center gap-1">
                        <Heart size={16} className="fill-white" />
                        <span>{Math.floor(p.price * 15 + 120)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageCircle size={16} className="fill-white" />
                        <span>{Math.floor(p.price * 2 + 12)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Rodapé do Perfil */}
            <div className="mt-8 text-center pt-4 border-t border-gray-200">
              <button
                onClick={handleOpenExternal}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#0095f6] hover:bg-[#1877f2] text-white font-bold text-xs rounded-lg shadow transition-colors cursor-pointer"
              >
                <span>Ver perfil completo no Instagram (@camisavetor)</span>
                <ExternalLink size={14} />
              </button>
            </div>
          </div>
        )}

        {/* 2. TIKTOK PREVIEW */}
        {currentNetwork === 'tiktok' && (
          <div className="max-w-3xl mx-auto p-4 sm:p-6 text-slate-800">
            {/* Header TikTok */}
            <div className="flex flex-col sm:flex-row items-center gap-6 border-b border-gray-200 pb-6">
              <div className="w-24 h-24 rounded-full bg-slate-900 border-2 border-[#00f2fe] p-1 flex items-center justify-center shadow-md shrink-0">
                <Image src="/tiktok.png" alt="TikTok" width={80} height={80} className="object-contain" />
              </div>

              <div className="flex-1 text-center sm:text-left space-y-2">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h1 className="text-xl font-bold text-slate-900">camisavetor</h1>
                  <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-bold">Camisa Vetor Oficial</span>
                  <CheckCircle2 size={16} className="text-[#20d5ec] fill-[#20d5ec] text-white" />
                </div>

                <div className="flex justify-center sm:justify-start gap-5 text-xs text-slate-700">
                  <span><strong>48</strong> Seguindo</span>
                  <span><strong>42.8K</strong> Seguidores</span>
                  <span><strong>284.6K</strong> Curtidas</span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed max-w-lg">
                  🔥 Bastidores da criação de vetores de camisas no CorelDRAW • Tutoriais de sublimação digital, separação de cores e montagem de mockups esportivos!
                </p>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                  <button
                    onClick={handleOpenExternal}
                    className="px-5 py-2 bg-[#fe2c55] hover:bg-[#e0264b] text-white font-bold text-xs rounded shadow transition-colors cursor-pointer"
                  >
                    Seguir no TikTok
                  </button>
                  <button
                    onClick={handleOpenExternal}
                    className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-xs font-bold rounded transition-colors cursor-pointer"
                  >
                    Ver Vídeos no App ↗
                  </button>
                </div>
              </div>
            </div>

            {/* Grid de Vídeos Simulado */}
            <div className="pt-6">
              <h2 className="text-xs font-bold text-gray-500 uppercase mb-3">Vídeos em Alta</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { title: 'Como vetorizar camisa de pesca no Corel 2026', views: '84.2K' },
                  { title: 'Sublimação total: dicas de fechamento de arquivo', views: '142.9K' },
                  { title: 'Estampa Interclasse pronta em 5 minutos', views: '61.4K' },
                  { title: 'Segredos da paleta CMYK para sublimação perfeita', views: '95.1K' },
                  { title: 'Lançamento Coleção Cavalgada e Vaquejada .CDR', views: '73.8K' },
                  { title: 'Transformando foto em vetor para camisa de futebol', views: '118.3K' },
                ].map((v, idx) => (
                  <div
                    key={idx}
                    onClick={handleOpenExternal}
                    className="group relative aspect-[9/14] bg-slate-900 rounded-lg overflow-hidden cursor-pointer shadow-md flex flex-col justify-end p-2.5 text-white"
                  >
                    {/* Fundo com estampa */}
                    {showcaseProducts[idx % showcaseProducts.length]?.urls?.capa && (
                      <Image
                        src={showcaseProducts[idx % showcaseProducts.length].urls.capa}
                        alt={v.title}
                        fill
                        className="object-contain p-2 opacity-80 group-hover:scale-105 transition-transform"
                        sizes="200px"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                    
                    <div className="relative z-10 space-y-1">
                      <div className="flex items-center gap-1 text-[10px] text-gray-300 font-bold">
                        <Play size={11} className="fill-white" />
                        <span>{v.views}</span>
                      </div>
                      <p className="text-[11px] font-medium leading-snug line-clamp-2 drop-shadow">
                        {v.title}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 3. YOUTUBE PREVIEW */}
        {currentNetwork === 'youtube' && (
          <div className="max-w-3xl mx-auto p-4 sm:p-6 text-slate-800">
            {/* Banner do Canal */}
            <div className="w-full h-28 sm:h-36 rounded-lg bg-gradient-to-r from-red-700 via-red-600 to-amber-600 p-4 flex items-center justify-between text-white shadow-md relative overflow-hidden">
              <div className="relative z-10">
                <h1 className="text-xl sm:text-2xl font-black drop-shadow tracking-tight">CAMISA VETOR</h1>
                <p className="text-xs text-red-100 font-medium">O Maior Canal de Vetores e Estampas para Sublimação</p>
              </div>
              <div className="relative z-10 w-16 h-16 rounded-full bg-white/20 backdrop-blur p-2 border border-white/40 hidden sm:flex items-center justify-center">
                <Play size={28} className="fill-white ml-1" />
              </div>
              <div className="absolute -right-6 -bottom-6 w-40 h-40 bg-white/10 rounded-full blur-xl" />
            </div>

            {/* Cabeçalho do Canal */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 py-4 border-b border-gray-200">
              <div className="w-20 h-20 rounded-full border-2 border-red-600 p-0.5 bg-white shadow shrink-0 flex items-center justify-center overflow-hidden">
                <Image src="/youtube.png" alt="YouTube" width={68} height={68} className="object-contain" />
              </div>

              <div className="flex-1 text-center sm:text-left space-y-1.5">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h2 className="text-lg font-bold text-slate-900">Camisa Vetor Oficial</h2>
                  <CheckCircle2 size={16} className="text-gray-600 fill-gray-600 text-white" />
                </div>
                <p className="text-xs text-gray-600">
                  @CAMISAVETOR • <strong>18,6 mil inscritos</strong> • <strong>142 vídeos</strong>
                </p>
                <p className="text-xs text-gray-700 max-w-xl">
                  Aprenda a criar, editar e separar estampas profissionais de camisas esportivas no CorelDRAW. Novos tutoriais toda semana!
                </p>
                <div className="pt-1">
                  <button
                    onClick={handleOpenExternal}
                    className="px-5 py-2 bg-[#cc0000] hover:bg-[#b00000] text-white font-bold text-xs rounded-full shadow transition-colors cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <span>Inscrever-se no Canal</span>
                    <ExternalLink size={12} />
                  </button>
                </div>
              </div>
            </div>

            {/* Vídeo em Destaque */}
            <div className="py-5">
              <h3 className="text-xs font-bold text-gray-500 uppercase mb-3">Vídeo em Destaque</h3>
              <div 
                onClick={handleOpenExternal}
                className="flex flex-col sm:flex-row gap-4 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="relative w-full sm:w-64 aspect-video bg-slate-900 rounded overflow-hidden shrink-0 flex items-center justify-center group">
                  {showcaseProducts[0]?.urls?.capa && (
                    <Image
                      src={showcaseProducts[0].urls.capa}
                      alt="Tutorial"
                      fill
                      className="object-contain p-2 group-hover:scale-105 transition-transform"
                      sizes="260px"
                    />
                  )}
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Play size={20} className="fill-white ml-0.5" />
                    </div>
                  </div>
                  <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] font-bold px-1.5 rounded">
                    16:42
                  </span>
                </div>

                <div className="flex-1 space-y-1">
                  <h4 className="font-bold text-sm text-slate-900 leading-snug">
                    TUTORIAL COMPLETO: Como Abrir e Personalizar Vetores .CDR de Camisas de Pesca no CorelDRAW
                  </h4>
                  <p className="text-xs text-gray-500">54.890 visualizações • Há 3 semanas</p>
                  <p className="text-xs text-gray-600 line-clamp-2">
                    Neste vídeo ensinamos o passo a passo de como trocar nomes, patrocinadores e números mantendo as curvas e cores ideais para a prensa térmica.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. PINTEREST PREVIEW */}
        {currentNetwork === 'pinterest' && (
          <div className="max-w-3xl mx-auto p-4 sm:p-6 text-slate-800">
            {/* Header Pinterest */}
            <div className="text-center space-y-2.5 pb-6 border-b border-gray-200">
              <div className="w-20 h-20 rounded-full border border-gray-200 bg-white p-2 mx-auto shadow flex items-center justify-center">
                <Image src="/Pinterest.png" alt="Pinterest" width={64} height={64} className="object-contain" />
              </div>
              <h1 className="text-xl font-bold text-slate-900">Camisa Vetor</h1>
              <p className="text-xs text-gray-500 font-medium">@camisavetor • <strong>72,4 mil visualizações mensais</strong></p>
              <p className="text-xs text-gray-700 max-w-md mx-auto leading-relaxed">
                Inspirações, mockups e paletas de estampas para camisas de pesca esportiva, cavalgada, terceirão e times de futebol sublimados.
              </p>
              <div className="flex justify-center gap-2 pt-1">
                <button
                  onClick={handleOpenExternal}
                  className="px-5 py-2 bg-[#e60023] hover:bg-[#ad081b] text-white font-bold text-xs rounded-full shadow transition-colors cursor-pointer"
                >
                  Seguir no Pinterest
                </button>
              </div>
            </div>

            {/* Masonry Pins Grid */}
            <div className="pt-6">
              <h2 className="text-xs font-bold text-gray-500 uppercase mb-3">Pastas e Ideias Salvas</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {showcaseProducts.map((p, idx) => (
                  <div
                    key={p.id}
                    onClick={handleOpenExternal}
                    className="group relative rounded-xl border border-gray-200 bg-white overflow-hidden shadow-xs hover:shadow-md cursor-pointer transition-all"
                  >
                    <div className="relative aspect-[3/4] bg-[#f8f8f8]">
                      {p.urls?.capa && (
                        <Image
                          src={p.urls.capa}
                          alt={p.name}
                          fill
                          className="object-contain p-2 group-hover:scale-105 transition-transform"
                          sizes="(max-width: 768px) 45vw, 220px"
                        />
                      )}
                      <button
                        onClick={e => { e.stopPropagation(); handleOpenExternal(); }}
                        className="absolute top-2 right-2 bg-[#e60023] text-white font-bold text-[10px] px-2.5 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow"
                      >
                        Salvar
                      </button>
                    </div>
                    <div className="p-2 text-left">
                      <p className="text-xs font-bold text-slate-800 leading-snug line-clamp-1">{p.name}</p>
                      <span className="text-[10px] text-gray-500">Camisa Vetor • .CDR Editável</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 5. LINKEDIN PREVIEW */}
        {currentNetwork === 'linkedin' && (
          <div className="max-w-3xl mx-auto p-4 sm:p-6 text-slate-800">
            {/* Card de Empresa LinkedIn */}
            <div className="rounded-lg border border-gray-300 bg-white overflow-hidden shadow-sm">
              <div className="h-24 sm:h-32 bg-gradient-to-r from-[#004182] via-[#0a66c2] to-[#378fe9] p-3 flex items-end">
                <span className="text-white/80 font-bold text-xs tracking-wider uppercase">Design Têxtil Digital & Vetorização</span>
              </div>

              <div className="px-5 pb-5 relative">
                <div className="w-20 h-20 rounded-lg border-2 border-white bg-white p-1 -mt-10 shadow-md flex items-center justify-center">
                  <Image src="/LinkedIn.png" alt="LinkedIn" width={68} height={68} className="object-contain" />
                </div>

                <div className="mt-3 space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h1 className="text-lg font-bold text-slate-900">Camisa Vetor - Soluções em Vetores Têxteis</h1>
                      <p className="text-xs text-gray-600">Desenvolvimento de Artes Vetoriais e Consultoria para Sublimação Digital</p>
                    </div>
                    <button
                      onClick={handleOpenExternal}
                      className="px-4 py-1.5 bg-[#0a66c2] hover:bg-[#004182] text-white font-bold text-xs rounded-full shadow transition-colors cursor-pointer"
                    >
                      + Seguir Empresa
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">Florianópolis, SC • Mais de 5.000 profissionais conectados</p>
                </div>
              </div>
            </div>

            {/* Publicação Recente do Feed */}
            <div className="mt-5 rounded-lg border border-gray-300 bg-white p-4 shadow-sm space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full border border-gray-200 bg-white p-1 flex items-center justify-center overflow-hidden shrink-0">
                  <Image src="/logo-icon.png" alt="Logo" width={32} height={32} className="object-contain" />
                </div>
                <div>
                  <h3 className="font-bold text-xs text-slate-900">Camisa Vetor</h3>
                  <p className="text-[10px] text-gray-500">Publicado há 2 dias • 🌐</p>
                </div>
              </div>

              <p className="text-xs text-gray-800 leading-relaxed">
                🚀 A indústria têxtil esportiva exige agilidade e precisão milimétrica nas curvas para evitar defeitos na impressão por sublimação. Nossos arquivos .CDR e .PDF são desenvolvidos diretamente na grade de medidas oficiais, garantindo encaixe perfeito de costura e cores fiéis em CMYK.
              </p>

              {showcaseProducts[1]?.urls?.capa && (
                <div className="w-full aspect-video bg-gray-50 rounded border border-gray-200 overflow-hidden relative">
                  <Image
                    src={showcaseProducts[1].urls.capa}
                    alt="Demonstração"
                    fill
                    className="object-contain p-2"
                    sizes="(max-width: 768px) 90vw, 680px"
                  />
                </div>
              )}

              <div className="flex items-center justify-around pt-2 border-t border-gray-200 text-xs text-gray-600 font-semibold">
                <button onClick={onPlayClick} className="flex items-center gap-1.5 hover:text-blue-700">
                  <ThumbsUp size={14} /> Curtir (184)
                </button>
                <button onClick={onPlayClick} className="flex items-center gap-1.5 hover:text-blue-700">
                  <MessageCircle size={14} /> Comentar (32)
                </button>
                <button onClick={handleOpenExternal} className="flex items-center gap-1.5 hover:text-blue-700">
                  <Share2 size={14} /> Compartilhar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── BARRA DE STATUS INFERIOR DO INTERNET EXPLORER ── */}
      <div className="bg-[#ece9d8] border-t border-[#d4d0c8] px-2 py-0.5 flex items-center justify-between text-[11px] text-[#555555] shrink-0 font-sans">
        <div className="flex items-center gap-1.5">
          <Globe size={12} className="text-[#0055ea]" />
          <span>Concluído</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline text-gray-500">Zona da Internet • Modo Protegido</span>
          <Lock size={11} className="text-gray-600" />
          <div className="w-2.5 h-2.5 flex flex-col justify-end items-end gap-0.5 opacity-60">
            <div className="w-1 h-0.5 bg-gray-600"></div>
            <div className="w-2 h-0.5 bg-gray-600"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
