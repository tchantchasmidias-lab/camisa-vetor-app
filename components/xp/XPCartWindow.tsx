'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Trash2, ArrowRight, ShieldCheck, ShoppingBag } from 'lucide-react';
import { safeLocalStorage } from '@/lib/safeStorage';
import { useGeo } from '@/lib/i18n/GeoContext';

interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

interface XPCartWindowProps {
  onPlayClick: () => void;
  onPlayNotify: () => void;
  onClose: () => void;
}

export default function XPCartWindow({ onPlayClick, onPlayNotify, onClose }: XPCartWindowProps) {
  const router = useRouter();
  const { formatPrice } = useGeo();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const loadCart = () => {
    try {
      const raw = safeLocalStorage.getItem('camisavetor_cart');
      if (raw) {
        setCartItems(JSON.parse(raw));
      } else {
        setCartItems([]);
      }
    } catch {
      setCartItems([]);
    }
  };

  useEffect(() => {
    loadCart();
    const handleUpdate = () => loadCart();
    window.addEventListener('cart-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('cart-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const handleRemove = (id: string) => {
    onPlayClick();
    const updated = cartItems.filter(item => item.id !== id);
    setCartItems(updated);
    safeLocalStorage.setItem('camisavetor_cart', JSON.stringify(updated));
    window.dispatchEvent(new Event('cart-updated'));
  };

  const handleClear = () => {
    onPlayClick();
    setCartItems([]);
    safeLocalStorage.removeItem('camisavetor_cart');
    window.dispatchEvent(new Event('cart-updated'));
  };

  const handleCheckout = () => {
    onPlayNotify();
    router.push('/checkout');
  };

  const subtotal = cartItems.reduce((acc, item) => acc + (Number(item.price) || 0) * (item.quantity || 1), 0);

  return (
    <div className="flex flex-col h-full bg-[#ece9d8] select-none text-[#202124]">
      {/* ── CABEÇALHO DO CARRINHO XP ── */}
      <div className="bg-gradient-to-r from-[#215dc6] to-[#457ad8] text-white p-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <ShoppingCart size={18} />
          </div>
          <div>
            <h2 className="text-sm font-bold">Assistente de Carrinho de Compras</h2>
            <p className="text-[11px] text-blue-100">Camisa Vetor • Pagamento Seguro & Download Imediato</p>
          </div>
        </div>
        <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded">
          {cartItems.length} {cartItems.length === 1 ? 'item' : 'itens'}
        </span>
      </div>

      {/* ── LISTA DE ITENS OU VAZIO ── */}
      <div className="flex-1 bg-white p-3 overflow-y-auto">
        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 py-8">
            <ShoppingBag size={48} className="text-gray-300 mb-2" />
            <p className="font-bold text-sm text-gray-700">Seu carrinho do Windows XP está vazio</p>
            <p className="text-xs text-gray-400 max-w-xs mt-1">
              Explore o Catálogo no Windows Explorer e adicione artes vetoriais incríveis.
            </p>
            <button
              onClick={onClose}
              className="mt-4 px-4 py-1.5 bg-[#215dc6] text-white text-xs font-bold rounded shadow hover:bg-[#194bb0]"
            >
              Explorar Catálogo
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {cartItems.map(item => (
              <div
                key={item.id}
                className="flex items-center justify-between p-2 rounded border border-gray-200 hover:border-blue-300 bg-gray-50/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 relative bg-white rounded border border-gray-200 overflow-hidden shrink-0">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-contain p-0.5"
                        sizes="48px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[9px] text-gray-400">Vetor</div>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 line-clamp-1">{item.name}</p>
                    <p className="text-[11px] text-gray-500">Formato: CorelDRAW / PDF</p>
                    <p className="text-xs font-black text-[#fe7302]">{formatPrice(item.price)}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleRemove(item.id)}
                  title="Remover do carrinho"
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── RESUMO E CHECKOUT ── */}
      {cartItems.length > 0 && (
        <div className="bg-[#ece9d8] border-t border-[#d4d0c8] p-3 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs text-gray-700">
            <span>Subtotal:</span>
            <span className="font-bold text-sm text-slate-900">{formatPrice(subtotal)}</span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-green-700">
            <ShieldCheck size={14} className="shrink-0" />
            <span>Pix com liberação automática e cartão de crédito via Mercado Pago / PayPal</span>
          </div>

          <div className="flex items-center justify-between gap-2 mt-1">
            <button
              onClick={handleClear}
              className="text-[11px] text-gray-500 hover:text-red-600 underline"
            >
              Esvaziar Carrinho
            </button>

            <button
              onClick={handleCheckout}
              className="py-2 px-5 bg-gradient-to-b from-[#458b22] to-[#346e19] hover:brightness-105 active:scale-95 text-white font-bold text-xs rounded shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <span>Finalizar Compra</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
