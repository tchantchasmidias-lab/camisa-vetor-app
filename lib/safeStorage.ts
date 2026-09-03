/**
 * Safe Storage Helpers
 * Proporciona acesso seguro a sessionStorage e localStorage com fallback resiliente
 * para evitar exceções de SecurityError (sandbox iframe, crawlers como Googlebot, modo anônimo restrito).
 */

const memorySessionStore = new Map<string, string>();
const memoryLocalStore = new Map<string, string>();

export const safeSessionStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        return window.sessionStorage.getItem(key);
      }
    } catch {
      // Bloqueado por sandbox de crawlers ou modo ultra restrito
    }
    return memorySessionStore.get(key) ?? null;
  },

  setItem: (key: string, value: string): void => {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.setItem(key, value);
        return;
      }
    } catch {
      // Falha silenciosa
    }
    memorySessionStore.set(key, value);
  },

  removeItem: (key: string): void => {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.removeItem(key);
      }
    } catch {
      // Falha silenciosa
    }
    memorySessionStore.delete(key);
  },

  clear: (): void => {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.clear();
      }
    } catch {
      // Falha silenciosa
    }
    memorySessionStore.clear();
  },
};

export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch {
      // Bloqueado por sandbox de crawlers ou modo ultra restrito
    }
    return memoryLocalStore.get(key) ?? null;
  },

  setItem: (key: string, value: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
        return;
      }
    } catch {
      // Falha silenciosa
    }
    memoryLocalStore.set(key, value);
  },

  removeItem: (key: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch {
      // Falha silenciosa
    }
    memoryLocalStore.delete(key);
  },

  clear: (): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.clear();
      }
    } catch {
      // Falha silenciosa
    }
    memoryLocalStore.clear();
  },
};
