'use client';

/**
 * useAssetLibrary — Hook para gerenciar a Biblioteca de Assets do Studio.
 *
 * Persiste os arquivos como base64 no localStorage do navegador.
 * Chave: 'cv-studio-assets-v1'
 *
 * Limitação: localStorage suporta ~5 MB por domínio.
 * Para projetos com muitos assets, migrar para IndexedDB no futuro.
 */

import { useState, useCallback } from 'react';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface Asset {
  id:       string;
  name:     string;
  mimeType: string;
  dataUrl:  string;  // base64 completo — serve como src de <img> e para o Fabric
  addedAt:  number;
}

// ─── Helpers de storage ───────────────────────────────────────────────────────

const STORAGE_KEY = 'cv-studio-assets-v1';

function readStorage(): Asset[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Asset[]) : [];
  } catch {
    return [];
  }
}

function writeStorage(assets: Asset[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(assets));
  } catch (err) {
    console.warn(
      '[AssetLibrary] ⚠️  Não foi possível salvar no localStorage ' +
      '(provável limite de espaço). Considere excluir assets antigos.',
      err
    );
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useAssetLibrary() {
  const [assets, setAssets] = useState<Asset[]>(readStorage);

  /** Converte um File para base64, salva na lista e persiste no localStorage */
  const addAsset = useCallback(async (file: File): Promise<Asset> => {
    const dataUrl = await fileToBase64(file);
    const asset: Asset = {
      id:       `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name:     file.name,
      mimeType: file.type,
      dataUrl,
      addedAt:  Date.now(),
    };
    setAssets(prev => {
      const updated = [asset, ...prev];
      writeStorage(updated);
      return updated;
    });
    console.log('[AssetLibrary] ✅ Asset salvo:', asset.name, `(${(dataUrl.length / 1024).toFixed(0)} KB)`);
    return asset;
  }, []);

  /** Remove um asset pelo id */
  const removeAsset = useCallback((id: string) => {
    setAssets(prev => {
      const updated = prev.filter(a => a.id !== id);
      writeStorage(updated);
      return updated;
    });
    console.log('[AssetLibrary] 🗑 Asset removido:', id);
  }, []);

  return { assets, addAsset, removeAsset };
}
