'use client';

/**
 * AssetDrawer — Gaveta lateral para Biblioteca de Assets.
 * Aparece ao lado da VerticalToolbox quando ativada.
 */

import { useRef } from 'react';
import { useStudio } from './StudioContext';
import { useAssetLibrary, type Asset } from './useAssetLibrary';
import { X, Upload, Trash2 } from 'lucide-react';

export default function AssetDrawer() {
  const { isAssetDrawerOpen, setIsAssetDrawerOpen, uploadInputRef, handleUploadFile } = useStudio();
  const { assets, addAsset, removeAsset } = useAssetLibrary();
  
  // Ref para o input de arquivo desta gaveta
  const localInputRef = useRef<HTMLInputElement>(null);

  if (!isAssetDrawerOpen) return null;

  const onLocalUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      // 1. Salva na biblioteca local
      const asset = await addAsset(file);
      
      // 2. Opcional: Já insere no canvas direto ao fazer upload (descomente se quiser)
      // handleUploadFile(file);
      
      e.target.value = ''; // Reseta o input
    } catch (err) {
      console.error('Erro ao fazer upload:', err);
    }
  };

  const handleInsertAsset = async (asset: Asset) => {
    try {
      // Fetch dataUrl to File object to reuse handleUploadFile logic
      const res = await fetch(asset.dataUrl);
      const blob = await res.blob();
      const file = new File([blob], asset.name, { type: asset.mimeType });
      
      handleUploadFile(file);
    } catch (err) {
      console.error('Erro ao inserir asset:', err);
    }
  };

  return (
    <div className="w-72 bg-[#1e2128] border-r border-white/[0.06] flex flex-col flex-shrink-0 z-20 shadow-2xl relative">
      {/* ── Header ── */}
      <div className="flex items-center justify-between p-3 border-b border-white/[0.06]">
        <h2 className="text-xs font-bold text-gray-300 uppercase tracking-widest">
          Biblioteca
        </h2>
        <button
          onClick={() => setIsAssetDrawerOpen(false)}
          className="p-1 text-gray-500 hover:text-white rounded-md hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* ── Botão de Novo Upload ── */}
      <div className="p-3 border-b border-white/[0.06]">
        <button
          onClick={() => localInputRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg
                     bg-white/5 hover:bg-white/10 border border-white/10 border-dashed
                     text-xs text-gray-300 hover:text-white transition-colors"
        >
          <Upload className="w-4 h-4" />
          Fazer Upload
        </button>
        <input
          type="file"
          ref={localInputRef}
          accept=".svg,.png,.jpg,.jpeg,.webp"
          className="hidden"
          onChange={onLocalUpload}
        />
      </div>

      {/* ── Lista de Assets ── */}
      <div className="flex-1 overflow-y-auto p-3">
        {assets.length === 0 ? (
          <p className="text-[11px] text-gray-600 italic text-center mt-4">
            Nenhum arquivo na biblioteca. Faça o upload de imagens ou vetores.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {assets.map((asset) => (
              <div
                key={asset.id}
                className="group relative aspect-square rounded-lg border border-white/10 
                           bg-black/20 overflow-hidden flex items-center justify-center
                           hover:border-orange-500/50 transition-colors cursor-pointer"
                onClick={() => handleInsertAsset(asset)}
              >
                {/* Checkered background para SVGs e PNGs com transparência */}
                <div className="absolute inset-0 z-0 opacity-20"
                     style={{
                       backgroundImage: `
                         linear-gradient(45deg, #fff 25%, transparent 25%),
                         linear-gradient(-45deg, #fff 25%, transparent 25%),
                         linear-gradient(45deg, transparent 75%, #fff 75%),
                         linear-gradient(-45deg, transparent 75%, #fff 75%)
                       `,
                       backgroundSize: '10px 10px',
                       backgroundPosition: '0 0, 0 5px, 5px -5px, -5px 0px',
                     }}
                />
                
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={asset.dataUrl}
                  alt={asset.name}
                  className="max-w-[80%] max-h-[80%] object-contain z-10 drop-shadow-md relative"
                />
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeAsset(asset.id);
                  }}
                  className="absolute top-1 right-1 p-1.5 rounded-md bg-red-500/80 text-white
                             opacity-0 group-hover:opacity-100 transition-opacity z-20 hover:bg-red-500"
                  title="Excluir"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
