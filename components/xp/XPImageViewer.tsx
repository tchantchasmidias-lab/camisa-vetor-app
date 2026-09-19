'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { 
  ZoomIn, ZoomOut, Maximize2, RotateCw, RotateCcw, 
  ShoppingCart, ExternalLink, Download, CheckCircle, ShieldCheck
} from 'lucide-react';
import type { Product } from '@/components/HomeClient';
import { useGeo } from '@/lib/i18n/GeoContext';
import { safeLocalStorage } from '@/lib/safeStorage';

interface XPImageViewerProps {
  product: Product | null;
  onAddToCartSuccess: () => void;
  onOpenCart: () => void;
  onPlayClick: () => void;
}

export default function XPImageViewer({ 
  product, 
  onAddToCartSuccess, 
  onOpenCart, 
  onPlayClick 
}: XPImageViewerProps) {
  const { formatPrice } = useGeo();
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [addedAnimation, setAddedAnimation] = useState(false);

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#ece9d8] p-8 text-center text-gray-500">
        <p className="text-sm">Nenhuma imagem carregada no visualizador.</p>
        <p className="text-xs text-gray-400 mt-1">Dê um duplo clique em qualquer produto no Catálogo para visualizar a estampa.</p>
      </div>
    );
  }

  const handleZoomIn = () => {
    onPlayClick();
    setZoom(prev => Math.min(prev + 0.25, 2.5));
  };

  const handleZoomOut = () => {
    onPlayClick();
    setZoom(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleResetZoom = () => {
    onPlayClick();
    setZoom(1);
    setRotation(0);
  };

  const handleRotateCw = () => {
    onPlayClick();
    setRotation(prev => (prev + 90) % 360);
  };

  const handleRotateCcw = () => {
    onPlayClick();
    setRotation(prev => (prev - 90 + 360) % 360);
  };

  const handleAddToCart = () => {
    onPlayClick();
    const rawCart = safeLocalStorage.getItem('camisavetor_cart');
    let cart: any[] = [];
    try {
      cart = rawCart ? JSON.parse(rawCart) : [];
    } catch {
      cart = [];
    }

    if (!cart.some((i: any) => i.id === product.id)) {
      cart.push({
        id: product.id,
        name: product.name,
        price: Number(product.price),
        image: product.urls?.capa || product.urls?.destaque,
        quantity: 1,
      });
    }

    safeLocalStorage.setItem('camisavetor_cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cart-updated'));

    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 1500);
    onAddToCartSuccess();
  };

  const handleBuyNow = () => {
    handleAddToCart();
    onOpenCart();
  };

  const mainImage = product.urls.destaque || product.urls.capa;

  return (
    <div className="flex flex-col h-full bg-[#ece9d8] select-none text-[#202124]">
      {/* ── BARRA DE TAREFAS SUPERIOR RETRÔ ── */}
      <div className="bg-[#ece9d8] border-b border-[#d4d0c8] px-3 py-1 flex items-center justify-between gap-2 text-xs">
        <span className="font-bold text-slate-800 truncate max-w-sm">
          {product.name} — Visualizador de Imagens do Windows
        </span>
        <span className="text-[11px] text-gray-500 hidden sm:inline">
          {product.category} • Formato CorelDRAW
        </span>
      </div>

      {/* ── ÁREA CENTRAL DE VISUALIZAÇÃO COM ZOOM / ROTAÇÃO ── */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Visualizador de Imagem Principal */}
        <div className="flex-1 bg-[#1a1a1a] relative flex items-center justify-center overflow-hidden p-4">
          <div
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              transition: 'transform 0.2s cubic-bezier(0.2, 0, 0, 1)',
            }}
            className="w-full h-full max-w-[460px] max-h-[460px] relative aspect-square flex items-center justify-center"
          >
            {mainImage ? (
              <Image
                src={mainImage}
                alt={product.name}
                fill
                className="object-contain drop-shadow-2xl"
                sizes="(max-width: 768px) 90vw, 500px"
                priority
              />
            ) : (
              <div className="text-gray-400 text-xs">Sem pré-visualização</div>
            )}
          </div>
        </div>

        {/* Painel Lateral de Especificações e Compra */}
        <div className="w-full md:w-80 bg-[#fbfbf9] border-t md:border-t-0 md:border-l border-[#d4d0c8] p-4 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-3">
            <div>
              <span className="inline-block bg-[#0055ea] text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm uppercase tracking-wider">
                Vetor Profissional
              </span>
              <h2 className="text-base font-bold text-slate-900 mt-1 leading-snug">
                {product.name}
              </h2>
              <p className="text-xs text-gray-500 font-medium">Categoria: {product.category}</p>
            </div>

            {/* Preço de Destaque */}
            <div className="p-3 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded">
              <span className="text-[11px] text-orange-800 font-bold uppercase tracking-wider block">
                Preço Promocional
              </span>
              <span className="text-2xl font-black text-[#fe7302]">
                {formatPrice(product.price)}
              </span>
              <span className="text-[10px] text-gray-500 block mt-0.5">
                Download imediato após a confirmação do pagamento
              </span>
            </div>

            {/* Checklist de Compatibilidade */}
            <div className="space-y-1.5 text-xs text-slate-700">
              <div className="flex items-center gap-2">
                <CheckCircle size={14} className="text-[#458b22] shrink-0" />
                <span>Arquivo editável em <strong>CorelDRAW (.CDR)</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={14} className="text-[#458b22] shrink-0" />
                <span>Arquivo em <strong>PDF Vetorial</strong> aberto</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={14} className="text-[#458b22] shrink-0" />
                <span>Cores em escala <strong>CMYK</strong> para sublimação</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck size={14} className="text-[#0055ea] shrink-0" />
                <span>Download imediato e seguro</span>
              </div>
            </div>
          </div>

          {/* Ações de Compra */}
          <div className="mt-4 space-y-2 pt-3 border-t border-gray-200">
            <button
              onClick={handleAddToCart}
              className={`w-full py-2 px-3 rounded flex items-center justify-center gap-2 text-xs font-bold text-white shadow transition-all active:scale-[0.98] ${
                addedAnimation
                  ? 'bg-[#458b22]'
                  : 'bg-gradient-to-b from-[#fe8724] to-[#e65a00] hover:brightness-105'
              }`}
            >
              <ShoppingCart size={14} />
              <span>{addedAnimation ? 'Adicionado ao Carrinho! ✓' : 'Adicionar ao Carrinho'}</span>
            </button>

            <button
              onClick={handleBuyNow}
              className="w-full py-2 px-3 rounded flex items-center justify-center gap-2 text-xs font-bold text-white bg-gradient-to-b from-[#215dc6] to-[#154699] hover:brightness-105 shadow transition-all active:scale-[0.98]"
            >
              <Download size={14} />
              <span>Comprar Agora (Abrir Carrinho)</span>
            </button>

            <a
              href={`/product/${product.slug || product.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-1.5 px-2 rounded flex items-center justify-center gap-1.5 text-[11px] font-medium text-[#215dc6] hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-colors"
            >
              <span>Abrir na Loja Oficial Moderna</span>
              <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </div>

      {/* ── BARRA INFERIOR DE CONTROLES DO VISUALIZADOR (ZOOM, ROTAÇÃO) ── */}
      <div className="bg-[#ece9d8] border-t border-[#d4d0c8] px-3 py-1.5 flex items-center justify-center gap-2 text-xs">
        <button
          onClick={handleZoomIn}
          className="p-1.5 rounded hover:bg-white/80 active:bg-black/10 border border-gray-300 bg-white shadow-sm"
          title="Aumentar Zoom"
        >
          <ZoomIn size={15} />
        </button>

        <button
          onClick={handleZoomOut}
          className="p-1.5 rounded hover:bg-white/80 active:bg-black/10 border border-gray-300 bg-white shadow-sm"
          title="Diminuir Zoom"
        >
          <ZoomOut size={15} />
        </button>

        <button
          onClick={handleResetZoom}
          className="p-1.5 rounded hover:bg-white/80 active:bg-black/10 border border-gray-300 bg-white shadow-sm"
          title="Tamanho Real"
        >
          <Maximize2 size={15} />
        </button>

        <div className="w-px h-5 bg-gray-300 mx-1" />

        <button
          onClick={handleRotateCcw}
          className="p-1.5 rounded hover:bg-white/80 active:bg-black/10 border border-gray-300 bg-white shadow-sm"
          title="Girar para a Esquerda"
        >
          <RotateCcw size={15} />
        </button>

        <button
          onClick={handleRotateCw}
          className="p-1.5 rounded hover:bg-white/80 active:bg-black/10 border border-gray-300 bg-white shadow-sm"
          title="Girar para a Direita"
        >
          <RotateCw size={15} />
        </button>

        <span className="text-[11px] text-gray-500 ml-2 font-mono">
          Zoom: {Math.round(zoom * 100)}%
        </span>
      </div>
    </div>
  );
}
