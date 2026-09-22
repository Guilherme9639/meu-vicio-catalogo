type BrowserCacheEntry<T> = {
  savedAt: number;
  value: T;
};

export function readBrowserCache<T>(key: string, maxAgeMs: number): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const entry = JSON.parse(raw) as BrowserCacheEntry<T>;
    if (!entry || typeof entry.savedAt !== 'number') return null;
    if (Date.now() - entry.savedAt > maxAgeMs) return null;
    return entry.value;
  } catch {
    return null;
  }
}

export function writeBrowserCache<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      key,
      JSON.stringify({ savedAt: Date.now(), value } satisfies BrowserCacheEntry<T>),
    );
  } catch {
    // O catálogo continua funcionando mesmo quando o armazenamento local está cheio ou indisponível.
  }
}
