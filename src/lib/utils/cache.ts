type CacheEntry<T> = {
  value: T;
  savedAt: number;
};

function isBrowser() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function setCache<T>(key: string, value: T) {
  if (!isBrowser()) {
    return;
  }

  const entry: CacheEntry<T> = {
    value,
    savedAt: Date.now(),
  };
  window.localStorage.setItem(key, JSON.stringify(entry));
}

export function getCache<T>(key: string, maxAgeMs?: number): T | null {
  if (!isBrowser()) {
    return null;
  }

  const raw = window.localStorage.getItem(key);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as CacheEntry<T>;
    if (
      maxAgeMs &&
      typeof parsed.savedAt === "number" &&
      Date.now() - parsed.savedAt > maxAgeMs
    ) {
      return null;
    }
    return parsed.value;
  } catch {
    return null;
  }
}

export function removeCache(key: string) {
  if (!isBrowser()) {
    return;
  }
  window.localStorage.removeItem(key);
}

