/**
 * Tiny localStorage-backed stores usable with `useSyncExternalStore`
 * (SSR-safe: the server snapshot is the default value).
 */

type Listener = () => void;

export interface BrowserStore<T> {
  get(): T;
  set(value: T): void;
  subscribe(listener: Listener): () => void;
  serverValue: T;
}

export function createBrowserStore<T>(
  key: string,
  defaultValue: T,
  parse: (raw: string) => T | undefined,
  serialize: (value: T) => string = (v) => String(v),
): BrowserStore<T> {
  const listeners = new Set<Listener>();
  let cache: { raw: string | null; value: T } | null = null;

  const read = (): T => {
    if (typeof window === "undefined") return defaultValue;
    let raw: string | null = null;
    try {
      raw = window.localStorage.getItem(key);
    } catch {
      return defaultValue;
    }
    if (cache && cache.raw === raw) return cache.value;
    const value = raw === null ? defaultValue : (parse(raw) ?? defaultValue);
    cache = { raw, value };
    return value;
  };

  if (typeof window !== "undefined") {
    window.addEventListener("storage", (e) => {
      if (e.key === key) listeners.forEach((l) => l());
    });
  }

  return {
    get: read,
    set(value) {
      try {
        window.localStorage.setItem(key, serialize(value));
      } catch {
        // Storage full or disabled: keep working in memory for this session.
        cache = { raw: serialize(value), value };
      }
      listeners.forEach((l) => l());
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    serverValue: defaultValue,
  };
}
