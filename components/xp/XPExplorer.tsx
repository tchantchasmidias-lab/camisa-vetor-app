'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { 
  ArrowLeft, ArrowRight, Folder, Search, LayoutGrid, List,
  HardDrive, ChevronDown, ChevronRight, FileText, CheckCircle, Tag
} from 'lucide-react';
import type { Product } from '@/components/HomeClient';
import { useGeo } from '@/lib/i18n/GeoContext';
import { normalizeSearchTerm } from '@/lib/stringUtils';

interface XPExplorerProps {
  products: Product[];
  onOpenProduct: (product: Product) => void;
  onPlayClick: () => void;
}

export default function XPExplorer({ products, onOpenProduct, onPlayClick }: XPExplorerProps) {
  const { formatPrice } = useGeo();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'thumbnails' | 'list'>('thumbnails');
  const [isTasksOpen, setIsTasksOpen] = useState(true);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(true);

  // Extrai lista única de categorias
  const categories = useMemo(() => {
    const map = new Map<string, number>();
    products.forEach(p => {
      const cat = p.category?.trim() || 'Geral';
      map.set(cat, (map.get(cat) || 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [products]);

  // Filtra produtos
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesCategory =
        selectedCategory === 'all' ||
        normalizeSearchTerm(p.category) === normalizeSearchTerm(selectedCategory);

      const matchesSearch =
        !searchQuery.trim() ||
        normalizeSearchTerm(p.name).includes(normalizeSearchTerm(searchQuery)) ||
        normalizeSearchTerm(p.category).includes(normalizeSearchTerm(searchQuery));

      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  const selectedProduct = useMemo(() => {
    return products.find(p => p.id === selectedProductId) || filteredProducts[0] || null;
  }, [products, selectedProductId, filteredProducts]);

  return (
    <div className="flex flex-col h-full bg-[#ece9d8] select-none text-[#202124]">
      {/* ── BARRA DE FERRAMENTAS DO EXPLORER ── */}
      <div className="bg-[#ece9d8] border-b border-[#d4d0c8] p-1.5 flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1">
          {/* Navegação */}
          <button 
            onClick={onPlayClick}
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-white/60 active:bg-black/10 text-gray-700 disabled:opacity-40"
          >
            <div className="w-5 h-5 rounded-full bg-gradient-to-b from-[#7ebb52] to-[#458b22] text-white flex items-center justify-center shadow-sm">
              <ArrowLeft size={13} strokeWidth={2.5} />
            </div>
            <span className="hidden sm:inline">Voltar</span>
          </button>

          <button 
            onClick={onPlayClick}
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-white/60 active:bg-black/10 text-gray-700 disabled:opacity-40"
          >
            <div className="w-5 h-5 rounded-full bg-gradient-to-b from-[#7ebb52] to-[#458b22] text-white flex items-center justify-center shadow-sm">
              <ArrowRight size={13} strokeWidth={2.5} />
            </div>
          </button>

          <div className="w-px h-5 bg-gray-300 mx-1" />

          {/* Pastas */}
          <button 
            onClick={() => { onPlayClick(); setIsCategoriesOpen(prev => !prev); }}
            className={`flex items-center gap-1 px-2 py-1 rounded border transition-colors ${
              isCategoriesOpen ? 'bg-white border-[#316ac5]' : 'border-transparent hover:bg-white/60'
            }`}
          >
            <Folder size={16} className="text-[#f5a623]" />
            <span className="hidden sm:inline font-medium">Pastas</span>
          </button>

          {/* Alternador de Visualização */}
          <button
            onClick={() => { onPlayClick(); setViewMode(prev => prev === 'thumbnails' ? 'list' : 'thumbnails'); }}
            className="flex items-center gap-1 px-2 py-1 rounded border border-transparent hover:bg-white/60"
            title="Alternar modo de exibição"
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
        </div>
      </div>

      {/* ── BARRA DE ENDEREÇO ── */}
      <div className="bg-[#ece9d8] border-b border-[#d4d0c8] px-2 py-1 flex items-center gap-2 text-xs">
        <span className="text-gray-500 font-medium shrink-0">Endereço</span>
        <div className="flex-1 flex items-center gap-1 bg-white border border-[#7f9db9] px-2 py-0.5 rounded shadow-inner">
          <HardDrive size={14} className="text-[#458b22]" />
          <span className="font-mono text-[11px] text-gray-700 truncate">
            C:\CamisaVetor\Catalogo\{selectedCategory === 'all' ? 'Todos os Vetores' : selectedCategory}
          </span>
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
                <button 
                  onClick={() => { onPlayClick(); setSelectedCategory('all'); setSearchQuery(''); }}
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
                <button
                  onClick={() => { onPlayClick(); setSelectedCategory('all'); }}
                  className={`w-full text-left px-1.5 py-1 rounded flex items-center justify-between ${
                    selectedCategory === 'all'
                      ? 'bg-[#316ac5] text-white font-bold'
                      : 'text-[#215dc6] hover:bg-white/70'
                  }`}
                >
                  <span>📁 Todas as Categorias</span>
                  <span className="text-[10px] opacity-80">({products.length})</span>
                </button>
                {categories.map(([cat, count]) => (
                  <button
                    key={cat}
                    onClick={() => { onPlayClick(); setSelectedCategory(cat); }}
                    className={`w-full text-left px-1.5 py-1 rounded flex items-center justify-between truncate ${
                      selectedCategory === cat
                        ? 'bg-[#316ac5] text-white font-bold'
                        : 'text-[#215dc6] hover:bg-white/70'
                    }`}
                  >
                    <span className="truncate">📂 {cat}</span>
                    <span className="text-[10px] opacity-80">({count})</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Caixa 3: Detalhes do Item Selecionado */}
          {selectedProduct && (
            <div className="bg-white rounded-t border border-[#0055ea] overflow-hidden shadow-sm text-[11px]">
              <div className="bg-gradient-to-r from-[#215dc6] to-[#638add] text-white font-bold text-xs px-2.5 py-1">
                Detalhes
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
          )}
        </div>

        {/* ── GRADE DE ARQUIVOS (PRODUTOS) ── */}
        <div className="flex-1 bg-white p-3 overflow-y-auto">
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-500 gap-2">
              <Folder size={40} className="text-gray-300" />
              <p className="text-xs">Nenhum arquivo encontrado nesta pasta.</p>
              <button
                onClick={() => { onPlayClick(); setSelectedCategory('all'); setSearchQuery(''); }}
                className="text-xs text-[#0055ea] hover:underline"
              >
                Limpar filtros de busca
              </button>
            </div>
          ) : viewMode === 'thumbnails' ? (
            /* Modo Miniaturas (Thumbnails) */
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
            /* Modo Lista */
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
        </div>
      </div>
    </div>
  );
}
