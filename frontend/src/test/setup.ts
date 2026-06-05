import '@testing-library/jest-dom';

// localStorage mock — happy-dom provides one, but ensure it's always clean
if (typeof globalThis.localStorage === 'undefined') {
  let _store: Record<string, string> = {};
  Object.defineProperty(globalThis, 'localStorage', {
    value: {
      getItem:    (k: string) => _store[k] ?? null,
      setItem:    (k: string, v: string) => { _store[k] = String(v); },
      removeItem: (k: string) => { delete _store[k]; },
      clear:      () => { _store = {}; },
      get length() { return Object.keys(_store).length; },
      key:        (i: number) => Object.keys(_store)[i] ?? null,
    },
    writable: true,
    configurable: true,
  });
}

// Stub browser APIs not present in test environments
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false, media: query, onchange: null,
      addListener: () => {}, removeListener: () => {},
      addEventListener: () => {}, removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

// Stub URL.createObjectURL / revokeObjectURL (used by xlsx download)
if (typeof URL !== 'undefined') {
  URL.createObjectURL = () => 'blob:mock';
  URL.revokeObjectURL = () => {};
}
