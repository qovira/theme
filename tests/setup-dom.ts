// Provide a Web Storage (`localStorage`) implementation for the DOM tests.
//
// Neither happy-dom nor Node 26 exposes a usable `localStorage` global here:
// Node installs a configurable getter that returns `undefined` (no
// --localstorage-file) and it shadows happy-dom's. We install a faithful
// in-memory `Storage` so the runtime's real getItem/setItem/removeItem/clear
// paths are exercised, and `Storage.prototype` exists for spying.

class MemoryStorage {
  private readonly map = new Map<string, string>();

  get length(): number {
    return this.map.size;
  }

  clear(): void {
    this.map.clear();
  }

  getItem(key: string): string | null {
    return this.map.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }

  removeItem(key: string): void {
    this.map.delete(key);
  }

  key(index: number): string | null {
    return [...this.map.keys()][index] ?? null;
  }
}

Object.defineProperty(globalThis, "Storage", {
  value: MemoryStorage,
  configurable: true,
  writable: true,
});

Object.defineProperty(globalThis, "localStorage", {
  value: new MemoryStorage(),
  configurable: true,
  writable: true,
});
