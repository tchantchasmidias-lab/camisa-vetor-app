'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { 
  ArrowLeft, ArrowRight, Folder, FolderUp, Search, LayoutGrid, List,
  HardDrive, ChevronDown, ChevronRight, FileText, CheckCircle, Tag,
  X as CloseIcon, Star
} from 'lucide-react';
import type { Product } from '@/components/HomeClient';
import { useGeo } from '@/lib/i18n/GeoContext';
import { normalizeSearchTerm } from '@/lib/stringUtils';

interface XPExplorerProps {
  products: Product[];
  onOpenProduct: (product: Product) => void;
  onPlayClick: () => void;
  onStatusChange?: (statusText: string, title?: string) => void;
}

interface CategoryFolderItem {
  id: string;
  name: string;
  count: number;
  previews: string[];
  isSpecial?: boolean;
}

export default function XPExplorer({ products, onOpenProduct, onPlayClick, onStatusChange }: XPExplorerProps) {
  const { formatPrice } = useGeo();
  const [searchQuery, setSearchQuery] = useState('');
  // currentFolder: null = raiz (C:\CamisaVetor\Catalogo), 'all' = Todos os Vetores, ou nome da categoria
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'thumbnails' | 'list'>('thumbnails');
  const [isTasksOpen, setIsTasksOpen] = useState(true);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(true);

  // Histórico de navegação do Explorer
  const [folderHistory, setFolderHistory] = useState<(string | null)[]>([null]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Extrai lista única de categorias e até 4 miniaturas representativas por categoria
  const categories = useMemo(() => {
    const map = new Map<string, { count: number; previews: string[] }>();
    products.forEach(p => {
      const cat = p.category?.trim() || 'Geral';
      const entry = map.get(cat) || { count: 0, previews: [] };
      entry.count += 1;
      const imgUrl = p.urls?.capa || p.urls?.destaque;
      if (imgUrl && entry.previews.length < 4 && !entry.previews.includes(imgUrl)) {
        entry.previews.push(imgUrl);
      }
      map.set(cat, entry);
    });
    return Array.from(map.entries())
      .map(([name, data]) => ({
        name,
        count: data.count,
        previews: data.previews,
      }))
      .sort((a, b) => b.count - a.count);
  }, [products]);

  // Miniaturas diversificadas para a pasta especial "Todos os Vetores"
  const allPreviews = useMemo(() => {
    const list: string[] = [];
    for (const cat of categories) {
      if (cat.previews[0] && !list.includes(cat.previews[0])) {
        list.push(cat.previews[0]);
        if (list.length >= 4) break;
      }
    }
    if (list.length < 4) {
      for (const p of products) {
        const url = p.urls?.capa || p.urls?.destaque;
        if (url && !list.includes(url)) {
          list.push(url);
          if (list.length >= 4) break;
        }
      }
    }
    return list;
  }, [categories, products]);

  // Lista de pastas exibidas na raiz (Todos os Vetores + Categorias)
  const allFolderItems: CategoryFolderItem[] = useMemo(() => {
    return [
      {
        id: 'all',
        name: 'Todos os Vetores',
        count: products.length,
        previews: allPreviews,
        isSpecial: true,
      },
      ...categories.map(cat => ({
        id: cat.name,
        name: cat.name,
        count: cat.count,
        previews: cat.previews,
        isSpecial: false,
      })),
    ];
  }, [products.length, allPreviews, categories]);

  // Filtra produtos de acordo com a pasta atual e/ou termo de busca
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesCategory =
        currentFolder === 'all' ||
        (currentFolder !== null && normalizeSearchTerm(p.category) === normalizeSearchTerm(currentFolder));

      const matchesSearch =
        !searchQuery.trim() ||
        normalizeSearchTerm(p.name).includes(normalizeSearchTerm(searchQuery)) ||
        normalizeSearchTerm(p.category).includes(normalizeSearchTerm(searchQuery));

      if (searchQuery.trim()) {
        return matchesSearch;
      }

      return matchesCategory;
    });
  }, [products, currentFolder, searchQuery]);

  // Item selecionado para exibição no painel lateral
  const selectedProduct = useMemo(() => {
    return products.find(p => p.id === selectedProductId) || filteredProducts[0] || null;
  }, [products, selectedProductId, filteredProducts]);

  const selectedFolderDetails = useMemo(() => {
    return allFolderItems.find(f => f.id === selectedFolderId) || allFolderItems[0] || null;
  }, [allFolderItems, selectedFolderId]);

  // Notifica o componente pai (XPWindow) para atualizar barra de status e título
  useEffect(() => {
    if (!onStatusChange) return;

    if (searchQuery.trim()) {
      onStatusChange(
        `${filteredProducts.length} arquivos encontrados`,
        `Pesquisa: "${searchQuery}" - C:\\CamisaVetor\\Catalogo`
      );
    } else if (currentFolder === null) {
      onStatusChange(
        `${allFolderItems.length} pastas`,
        'Catálogo de Vetores - C:\\CamisaVetor\\Catalogo'
      );
    } else {
      const folderName = currentFolder === 'all' ? 'Todos os Vetores' : currentFolder;
      onStatusChange(
        `${filteredProducts.length} arquivos`,
        `${folderName} - C:\\CamisaVetor\\Catalogo\\${folderName}`
      );
    }
  }, [currentFolder, filteredProducts.length, allFolderItems.length, searchQuery, onStatusChange]);

  // Abertura de pasta
  const handleOpenFolder = (folderId: string) => {
    onPlayClick();
    setCurrentFolder(folderId);
    setSelectedFolderId(folderId);
    setSelectedProductId(null);
    setSearchQuery('');
    setFolderHistory(prev => [...prev.slice(0, historyIndex + 1), folderId]);
    setHistoryIndex(prev => prev + 1);
  };

  // Retorno para o diretório raiz
  const goToRoot = () => {
    onPlayClick();
    setCurrentFolder(null);
    setSelectedProductId(null);
    setSearchQuery('');
    setFolderHistory(prev => [...prev.slice(0, historyIndex + 1), null]);
    setHistoryIndex(prev => prev + 1);
  };

  // Navegação Voltar
  const handleGoBack = () => {
    if (historyIndex > 0) {
      onPlayClick();
      const newIdx = historyIndex - 1;
      setHistoryIndex(newIdx);
      setCurrentFolder(folderHistory[newIdx]);
      setSelectedProductId(null);
      setSearchQuery('');
    }
  };

  // Navegação Avançar
  const handleGoForward = () => {
    if (historyIndex < folderHistory.length - 1) {
      onPlayClick();
      const newIdx = historyIndex + 1;
      setHistoryIndex(newIdx);
      setCurrentFolder(folderHistory[newIdx]);
      setSelectedProductId(null);
      setSearchQuery('');
    }
  };

  // Determina se está exibindo a raiz em pastas ou a lista de arquivos
  const isViewingRoot = currentFolder === null && !searchQuery.trim();

  return (
    <div className="flex flex-col h-full bg-[#ece9d8] select-none text-[#202124]">
      {/* ── BARRA DE FERRAMENTAS DO EXPLORER ── */}
      <div className="bg-[#ece9d8] border-b border-[#d4d0c8] p-1.5 flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1">
          {/* Voltar */}
          <button 
            onClick={handleGoBack}
            disabled={historyIndex <= 0}
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-white/60 active:bg-black/10 text-gray-700 disabled:opacity-35 disabled:pointer-events-none"
            title="Voltar"
          >
            <div className="w-5 h-5 rounded-full bg-gradient-to-b from-[#7ebb52] to-[#458b22] text-white flex items-center justify-center shadow-sm">
              <ArrowLeft size={13} strokeWidth={2.5} />
            </div>
            <span className="hidden sm:inline">Voltar</span>
          </button>

          {/* Avançar */}
          <button 
            onClick={handleGoForward}
            disabled={historyIndex >= folderHistory.length - 1}
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-white/60 active:bg-black/10 text-gray-700 disabled:opacity-35 disabled:pointer-events-none"
            title="Avançar"
          >
            <div className="w-5 h-5 rounded-full bg-gradient-to-b from-[#7ebb52] to-[#458b22] text-white flex items-center justify-center shadow-sm">
              <ArrowRight size={13} strokeWidth={2.5} />
            </div>
          </button>

          {/* Pasta Acima (Up one level) */}
          <button
            onClick={goToRoot}
            disabled={isViewingRoot}
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-white/60 active:bg-black/10 text-gray-700 disabled:opacity-35 disabled:pointer-events-none"
            title="Pasta Acima (Retornar para C:\CamisaVetor\Catalogo)"
          >
            <div className="w-5 h-5 rounded bg-amber-100 border border-amber-400 flex items-center justify-center text-[#f5a623] shadow-xs">
              <FolderUp size={13} className="text-[#b87d10]" />
            </div>
            <span className="hidden sm:inline font-medium">Pasta Acima</span>
          </button>

          <div className="w-px h-5 bg-gray-300 mx-1" />

          {/* Pastas (Toggle lateral) */}
          <button 
            onClick={() => { onPlayClick(); setIsCategoriesOpen(prev => !prev); }}
            className={`flex items-center gap-1 px-2 py-1 rounded border transition-colors ${
              isCategoriesOpen ? 'bg-white border-[#316ac5]' : 'border-transparent hover:bg-white/60'
            }`}
            title="Exibir ou ocultar painel de pastas"
          >
            <Folder size={15} className="text-[#f5a623] fill-[#f5a623]" />
            <span className="hidden sm:inline font-medium">Pastas</span>
          </button>

          {/* Alternador de Visualização */}
          <button
            onClick={() => { onPlayClick(); setViewMode(prev => prev === 'thumbnails' ? 'list' : 'thumbnails'); }}
            className="flex items-center gap-1 px-2 py-1 rounded border border-transparent hover:bg-white/60"
            title="Alternar modo de exibição (Miniaturas / Lista)"
          >
            {viewMode === 'thumbnails' ? <LayoutGrid size={15} /> : <List size={15} />}
            <span className="hidden sm:inline">{viewMode === 'thumbnails' ? 'Miniaturas' : 'Lista'}</span>
          </button>
        </div>

        {/* Campo de Pesquisa do Explorer */}
        <div className="flex items-center gap-1 bg-white border border-[#7f9db9] rounded px-2 py-1 shadow-inner max-w-[240px] w-full">
          <Search size={14} className="text-[#0055ea] shrink-0" />
          <input
            type="text"
            placeholder="Pesquisar arquivos..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-xs text-slate-800 outline-none placeholder:text-gray-400"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-gray-700">
              <CloseIcon size={12} />
            </button>
          )}
        </div>
      </div>

      {/* ── BARRA DE ENDEREÇO ── */}
      <div className="bg-[#ece9d8] border-b border-[#d4d0c8] px-2 py-1 flex items-center gap-2 text-xs">
        <span className="text-gray-500 font-medium shrink-0">Endereço</span>
        <div className="flex-1 flex items-center gap-1.5 bg-white border border-[#7f9db9] px-2 py-0.5 rounded shadow-inner overflow-hidden">
          {currentFolder === null && !searchQuery.trim() ? (
            <HardDrive size={14} className="text-[#458b22] shrink-0" />
          ) : (
            <Folder size={14} className="text-[#f5a623] fill-[#f5a623] shrink-0" />
          )}
          <div className="font-mono text-[11px] text-gray-700 truncate flex items-center gap-1">
            <span className="text-gray-400">C:\CamisaVetor\</span>
            <button
              onClick={() => {
                if (!isViewingRoot) {
                  goToRoot();
                }
              }}
              className={`hover:underline cursor-pointer font-semibold ${
                isViewingRoot ? 'text-blue-900' : 'text-blue-700'
              }`}
              title="Ir para a Raiz do Catálogo"
            >
              Catalogo
            </button>
            {currentFolder !== null && (
              <>
                <span className="text-gray-400">\</span>
                <span className="text-slate-900 font-semibold truncate">
                  {currentFolder === 'all' ? 'Todos os Vetores' : currentFolder}
                </span>
              </>
            )}
            {searchQuery.trim() !== '' && (
              <>
                <span className="text-gray-400">\</span>
                <span className="text-amber-700 font-semibold truncate">
                  Pesquisa: &quot;{searchQuery}&quot;
                </span>
              </>
            )}
          </div>
        </div>
        <button 
          onClick={onPlayClick}
          className="px-2 py-0.5 bg-[#ece9d8] hover:bg-[#f5f4ea] border border-[#7f9db9] rounded text-[11px] font-medium active:bg-[#d4d0c8]"
        >
          Ir
        </button>
      </div>

      {/* ── ÁREA PRINCIPAL DO EXPLORER (PAINEL ESQUERDO + CONTEÚDO) ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Painel Lateral Clássico XP (Tarefas e Detalhes) */}
        <div className="hidden md:flex flex-col w-56 shrink-0 bg-gradient-to-b from-[#7ba2e7] to-[#6375d6] p-2 gap-2.5 overflow-y-auto border-r border-[#0055ea]">
          {/* Caixa 1: Tarefas */}
          <div className="bg-white rounded-t border border-[#0055ea] overflow-hidden shadow-sm">
            <button
              onClick={() => setIsTasksOpen(!isTasksOpen)}
              className="w-full bg-gradient-to-r from-[#215dc6] to-[#638add] text-white font-bold text-xs px-2.5 py-1 flex items-center justify-between"
            >
              <span>Tarefas de Arquivo</span>
              {isTasksOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
            {isTasksOpen && (
              <div className="p-2 space-y-1.5 text-[11px] text-[#215dc6] bg-[#d6dff7]/40">
                {!isViewingRoot && (
                  <button 
                    onClick={goToRoot}
                    className="w-full text-left flex items-center gap-1.5 hover:underline font-bold text-[#0055ea]"
                  >
                    <FolderUp size={13} className="text-[#f5a623]" />
                    <span>📁 Pasta Acima (Catálogo)</span>
                  </button>
                )}
                <button 
                  onClick={() => handleOpenFolder('all')}
                  className="w-full text-left flex items-center gap-1.5 hover:underline"
                >
                  <Folder size={13} className="text-[#f5a623]" />
                  <span>Ver todas as artes ({products.length})</span>
                </button>
                <div className="w-full text-left flex items-center gap-1.5 text-gray-600">
                  <CheckCircle size={13} className="text-[#458b22]" />
                  <span>Vetor CorelDRAW Editável</span>
                </div>
                <div className="w-full text-left flex items-center gap-1.5 text-gray-600">
                  <Tag size={13} className="text-[#fe7302]" />
                  <span>Download Imediato (.CDR/.PDF)</span>
                </div>
              </div>
            )}
          </div>

          {/* Caixa 2: Categorias */}
          <div className="bg-white rounded-t border border-[#0055ea] overflow-hidden shadow-sm">
            <button
              onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
              className="w-full bg-gradient-to-r from-[#215dc6] to-[#638add] text-white font-bold text-xs px-2.5 py-1 flex items-center justify-between"
            >
              <span>Categorias de Vetor</span>
              {isCategoriesOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
            {isCategoriesOpen && (
              <div className="p-2 space-y-1 text-[11px] bg-[#d6dff7]/40 max-h-48 overflow-y-auto">
                {/* Raiz do Catálogo */}
                <button
                  onClick={goToRoot}
                  className={`w-full text-left px-1.5 py-1 rounded flex items-center justify-between ${
                    isViewingRoot
                      ? 'bg-[#316ac5] text-white font-bold'
                      : 'text-[#215dc6] hover:bg-white/70'
                  }`}
                >
                  <span>📁 Raiz do Catálogo (Pastas)</span>
                  <span className="text-[10px] opacity-80">({allFolderItems.length})</span>
                </button>

                {/* Todos os Vetores */}
                <button
                  onClick={() => handleOpenFolder('all')}
                  className={`w-full text-left px-1.5 py-1 rounded flex items-center justify-between ${
                    currentFolder === 'all' && !searchQuery.trim()
                      ? 'bg-[#316ac5] text-white font-bold'
                      : 'text-[#215dc6] hover:bg-white/70'
                  }`}
                >
                  <span>⭐ Todos os Vetores</span>
                  <span className="text-[10px] opacity-80">({products.length})</span>
                </button>

                {/* Lista de Categorias */}
                {categories.map(cat => (
                  <button
                    key={cat.name}
                    onClick={() => handleOpenFolder(cat.name)}
                    className={`w-full text-left px-1.5 py-1 rounded flex items-center justify-between truncate ${
                      currentFolder === cat.name && !searchQuery.trim()
                        ? 'bg-[#316ac5] text-white font-bold'
                        : 'text-[#215dc6] hover:bg-white/70'
                    }`}
                  >
                    <span className="truncate">📂 {cat.name}</span>
                    <span className="text-[10px] opacity-80">({cat.count})</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Caixa 3: Detalhes do Item ou da Pasta */}
          {isViewingRoot ? (
            /* Detalhes da pasta selecionada na raiz */
            <div className="bg-white rounded-t border border-[#0055ea] overflow-hidden shadow-sm text-[11px]">
              <div className="bg-gradient-to-r from-[#215dc6] to-[#638add] text-white font-bold text-xs px-2.5 py-1">
                Detalhes da Pasta
              </div>
              <div className="p-2 bg-[#d6dff7]/40 space-y-1.5">
                <div className="flex items-center gap-2">
                  <Folder size={24} className="text-[#f5a623] fill-[#f5a623] shrink-0" />
                  <div className="overflow-hidden">
                    <p className="font-bold text-slate-800 leading-snug truncate">
                      {selectedFolderDetails ? selectedFolderDetails.name : 'Catálogo de Vetores'}
                    </p>
                    <p className="text-gray-600 text-[10px]">Pasta de arquivos</p>
                  </div>
                </div>
                <p className="text-gray-600">
                  Total de arquivos:{' '}
                  <strong className="text-slate-800">
                    {selectedFolderDetails ? selectedFolderDetails.count : products.length}
                  </strong>
                </p>
                <p className="text-gray-600">Formato: CorelDRAW (.CDR) / PDF</p>
                {selectedFolderDetails && (
                  <button
                    onClick={() => handleOpenFolder(selectedFolderDetails.id)}
                    className="w-full py-1 bg-[#458b22] hover:bg-[#38741b] text-white font-bold text-center rounded shadow cursor-pointer text-xs flex items-center justify-center gap-1 mt-2"
                  >
                    <span>📁 Abrir Pasta</span>
                  </button>
                )}
              </div>
            </div>
          ) : selectedProduct ? (
            /* Detalhes do produto selecionado */
            <div className="bg-white rounded-t border border-[#0055ea] overflow-hidden shadow-sm text-[11px]">
              <div className="bg-gradient-to-r from-[#215dc6] to-[#638add] text-white font-bold text-xs px-2.5 py-1">
                Detalhes do Arquivo
              </div>
              <div className="p-2 bg-[#d6dff7]/40 space-y-1.5">
                <div className="w-full aspect-square relative bg-white border border-gray-300 rounded overflow-hidden shadow-sm">
                  {selectedProduct.urls.capa ? (
                    <Image
                      src={selectedProduct.urls.capa}
                      alt={selectedProduct.name}
                      fill
                      className="object-contain p-1"
                      sizes="180px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">Sem imagem</div>
                  )}
                </div>
                <p className="font-bold text-slate-800 leading-snug line-clamp-2">{selectedProduct.name}</p>
                <p className="text-gray-600">Tipo: Vetor CorelDRAW (.CDR)</p>
                <p className="font-bold text-[#e65100] text-xs">Preço: {formatPrice(selectedProduct.price)}</p>
                <button
                  onClick={() => { onPlayClick(); onOpenProduct(selectedProduct); }}
                  className="w-full py-1 bg-[#458b22] hover:bg-[#38741b] text-white font-bold text-center rounded shadow cursor-pointer text-xs"
                >
                  🔍 Abrir no Visualizador
                </button>
              </div>
            </div>
          ) : null}
        </div>

        {/* ── ÁREA DE CONTEÚDO (PASTAS NA RAIZ OU ARQUIVOS NO DIRETÓRIO) ── */}
        <div className="flex-1 bg-white p-3 overflow-y-auto">
          {isViewingRoot ? (
            /* ── VISUALIZAÇÃO RAIZ: PASTAS AMARELAS CLÁSSICAS DO WINDOWS XP ── */
            viewMode === 'thumbnails' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {allFolderItems.map(folder => {
                  const isSelected = selectedFolderId === folder.id;
                  return (
                    <div
                      key={folder.id}
                      onClick={() => {
                        setSelectedFolderId(folder.id);
                        handleOpenFolder(folder.id);
                      }}
                      onDoubleClick={() => handleOpenFolder(folder.id)}
                      className={`group flex flex-col items-center p-2.5 rounded cursor-pointer border transition-all select-none ${
                        isSelected
                          ? 'bg-[#316ac5]/15 border-[#316ac5] shadow-sm'
                          : 'border-transparent hover:bg-blue-50/70 hover:border-blue-200'
                      }`}
                      title={`${folder.name} (${folder.count} arquivos) - Clique para abrir a pasta`}
                    >
                      {/* ÍCONE DE PASTA AMARELA WINDOWS XP COM PREVIEW DE MINIATURAS */}
                      <div className="relative w-24 h-20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-150">
                        {/* Aba superior esquerda da pasta */}
                        <div className="absolute top-1 left-2 w-9 h-3 bg-gradient-to-r from-[#ffe482] via-[#f7c844] to-[#df9917] border-t border-l border-r border-[#b87d10] rounded-t-sm z-0" />
                        
                        {/* Corpo traseiro da pasta */}
                        <div className="absolute top-3 inset-x-1 bottom-1 bg-gradient-to-b from-[#ffd752] via-[#f5bd38] to-[#d68f12] rounded-[4px] border border-[#b87d10] shadow-sm z-0" />

                        {/* Janela interna branca de miniaturas (Preview das estampas) */}
                        <div className="relative z-10 w-[78px] h-[52px] mt-1 bg-white rounded-[2px] border border-[#b87d10]/70 p-0.5 shadow-[inset_0_1px_2px_rgba(0,0,0,0.12)] overflow-hidden">
                          {folder.previews.length === 0 ? (
                            <div className="w-full h-full flex items-center justify-center bg-amber-50/40">
                              <Folder size={22} className="text-[#f5a623]" />
                            </div>
                          ) : folder.previews.length === 1 ? (
                            <div className="relative w-full h-full bg-white">
                              <Image
                                src={folder.previews[0]}
                                alt={folder.name}
                                fill
                                className="object-contain p-0.5"
                                sizes="80px"
                              />
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 grid-rows-2 gap-0.5 w-full h-full bg-slate-100">
                              {folder.previews.slice(0, 4).map((url, idx) => (
                                <div key={idx} className="relative w-full h-full bg-white overflow-hidden">
                                  <Image
                                    src={url}
                                    alt=""
                                    fill
                                    className="object-contain p-0.5"
                                    sizes="40px"
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Aba frontal inferior da pasta com efeito de aba aberta e relevo */}
                        <div className="absolute bottom-1 inset-x-1 h-4 bg-gradient-to-t from-[#c67c05]/85 via-[#f5ad25]/60 to-transparent rounded-b-[4px] pointer-events-none z-20" />

                        {/* Tag especial para 'Todos os Vetores' */}
                        {folder.isSpecial && (
                          <span className="absolute -top-0.5 -right-0.5 z-30 bg-[#0055ea] text-white text-[8px] font-black px-1.5 py-0.2 rounded-full shadow border border-white tracking-wider flex items-center gap-0.5">
                            <Star size={8} className="fill-white" /> TODOS
                          </span>
                        )}
                      </div>

                      {/* Nome da Categoria e Quantidade de Arquivos */}
                      <div className="mt-2 text-center flex flex-col items-center w-full px-1">
                        <span
                          className={`text-[11px] font-medium leading-snug line-clamp-2 px-1 rounded transition-colors ${
                            isSelected ? 'bg-[#316ac5] text-white' : 'text-gray-900 group-hover:text-blue-700'
                          }`}
                          title={folder.name}
                        >
                          {folder.name}
                        </span>
                        <span className="text-[10px] text-gray-500 font-normal mt-0.5">
                          {folder.count} {folder.count === 1 ? 'arquivo' : 'arquivos'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Modo Lista de Pastas */
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500 font-semibold text-[11px]">
                    <th className="py-1 px-2">Nome</th>
                    <th className="py-1 px-2">Total de Arquivos</th>
                    <th className="py-1 px-2">Tipo</th>
                    <th className="py-1 px-2">Formato</th>
                  </tr>
                </thead>
                <tbody>
                  {allFolderItems.map(folder => {
                    const isSelected = selectedFolderId === folder.id;
                    return (
                      <tr
                        key={folder.id}
                        onClick={() => {
                          setSelectedFolderId(folder.id);
                          handleOpenFolder(folder.id);
                        }}
                        onDoubleClick={() => handleOpenFolder(folder.id)}
                        className={`cursor-pointer border-b border-gray-50 transition-colors ${
                          isSelected ? 'bg-[#316ac5] text-white' : 'hover:bg-blue-50/60'
                        }`}
                      >
                        <td className="py-1.5 px-2 flex items-center gap-2 font-medium">
                          <Folder size={16} className={isSelected ? 'text-white' : 'text-[#f5a623] fill-[#f5a623]'} />
                          <span className="truncate max-w-[200px] sm:max-w-xs">{folder.name}</span>
                          {folder.isSpecial && (
                            <span className="text-[9px] bg-blue-100 text-blue-800 px-1 rounded">Mestre</span>
                          )}
                        </td>
                        <td className="py-1.5 px-2">{folder.count} {folder.count === 1 ? 'arquivo' : 'arquivos'}</td>
                        <td className="py-1.5 px-2">Pasta de arquivos</td>
                        <td className="py-1.5 px-2 font-mono text-[10px]">Vetor CorelDRAW (.CDR)</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )
          ) : (
            /* ── VISUALIZAÇÃO DE ARQUIVOS (DENTRO DE UMA PASTA OU RESULTADOS DE BUSCA) ── */
            <>
              {/* Barra de navegação interna de pasta / resultados */}
              <div className="mb-2 pb-1.5 border-b border-gray-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={goToRoot}
                    className="flex items-center gap-1 text-[#0055ea] hover:underline font-semibold"
                  >
                    <FolderUp size={13} />
                    <span>Catálogo Raiz</span>
                  </button>
                  <span className="text-gray-400">/</span>
                  <span className="font-bold text-gray-800">
                    {searchQuery.trim()
                      ? `Pesquisa: "${searchQuery}"`
                      : currentFolder === 'all'
                      ? 'Todos os Vetores'
                      : currentFolder}
                  </span>
                  <span className="text-gray-500 text-[11px]">
                    ({filteredProducts.length} {filteredProducts.length === 1 ? 'arquivo' : 'arquivos'})
                  </span>
                </div>

                {searchQuery.trim() && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-xs text-[#0055ea] hover:underline"
                  >
                    Limpar pesquisa
                  </button>
                )}
              </div>

              {filteredProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-gray-500 gap-2">
                  <Folder size={40} className="text-gray-300" />
                  <p className="text-xs">Nenhum arquivo encontrado nesta pasta.</p>
                  <button
                    onClick={goToRoot}
                    className="text-xs text-[#0055ea] hover:underline flex items-center gap-1 font-semibold"
                  >
                    <FolderUp size={14} />
                    <span>Voltar para o Catálogo de Pastas</span>
                  </button>
                </div>
              ) : viewMode === 'thumbnails' ? (
                /* Modo Miniaturas de Arquivos */
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {filteredProducts.map(product => {
                    const isSelected = selectedProductId === product.id;
                    return (
                      <div
                        key={product.id}
                        onClick={() => { onPlayClick(); setSelectedProductId(product.id); }}
                        onDoubleClick={() => { onPlayClick(); onOpenProduct(product); }}
                        className={`group flex flex-col items-center p-2 rounded cursor-pointer border transition-all ${
                          isSelected
                            ? 'bg-[#316ac5]/15 border-[#316ac5] shadow-sm'
                            : 'border-transparent hover:bg-blue-50/70 hover:border-blue-200'
                        }`}
                        title={`${product.name} - Duplo clique para abrir no Visualizador`}
                      >
                        {/* Miniatura do Arquivo */}
                        <div className="w-full aspect-square relative bg-[#f8f8f8] border border-gray-200 rounded overflow-hidden shadow-inner group-hover:shadow transition-shadow">
                          {product.urls.capa ? (
                            <Image
                              src={product.urls.capa}
                              alt={product.name}
                              fill
                              className="object-contain p-1 group-hover:scale-105 transition-transform"
                              sizes="(max-width: 768px) 45vw, 160px"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">Sem preview</div>
                          )}
                          {/* Badge de extensão .cdr */}
                          <span className="absolute bottom-1 right-1 bg-[#0055ea] text-white text-[9px] font-bold px-1 rounded shadow">
                            .CDR
                          </span>
                        </div>

                        {/* Rótulo do Arquivo */}
                        <div className="w-full mt-1.5 text-center">
                          <p className={`text-[11px] font-medium leading-tight line-clamp-2 px-1 rounded ${
                            isSelected ? 'bg-[#316ac5] text-white' : 'text-gray-800'
                          }`}>
                            {product.name}
                          </p>
                          <span className="inline-block mt-1 font-bold text-[#e65100] text-[11px]">
                            {formatPrice(product.price)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Modo Lista de Arquivos */
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-500 font-semibold text-[11px]">
                      <th className="py-1 px-2">Nome</th>
                      <th className="py-1 px-2">Categoria</th>
                      <th className="py-1 px-2">Tipo</th>
                      <th className="py-1 px-2">Preço</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map(product => {
                      const isSelected = selectedProductId === product.id;
                      return (
                        <tr
                          key={product.id}
                          onClick={() => { onPlayClick(); setSelectedProductId(product.id); }}
                          onDoubleClick={() => { onPlayClick(); onOpenProduct(product); }}
                          className={`cursor-pointer border-b border-gray-50 transition-colors ${
                            isSelected ? 'bg-[#316ac5] text-white' : 'hover:bg-blue-50/60'
                          }`}
                        >
                          <td className="py-1.5 px-2 flex items-center gap-2 font-medium">
                            <FileText size={14} className={isSelected ? 'text-white' : 'text-[#0055ea]'} />
                            <span className="truncate max-w-[200px] sm:max-w-xs">{product.name}</span>
                          </td>
                          <td className="py-1.5 px-2">{product.category}</td>
                          <td className="py-1.5 px-2 font-mono text-[10px]">Vetor CorelDRAW (.CDR)</td>
                          <td className={`py-1.5 px-2 font-bold ${isSelected ? 'text-white' : 'text-[#e65100]'}`}>
                            {formatPrice(product.price)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
