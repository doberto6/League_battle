const memoryStore = new Map();

export function getStorageAdapter() {
  if (typeof window !== "undefined" && window.storage) {
    return {
      async list(prefix) {
        return window.storage.list(prefix, false);
      },
      async get(key) {
        return window.storage.get(key, false);
      },
      async set(key, value) {
        return window.storage.set(key, value, false);
      },
      async delete(key) {
        return window.storage.delete(key, false);
      },
    };
  }

  const storage = {
    async list(prefix = "") {
      const keys = [];
      if (typeof localStorage !== "undefined") {
        for (const key of Object.keys(localStorage)) {
          if (key.startsWith(prefix)) keys.push(key);
        }
      } else {
        for (const key of memoryStore.keys()) {
          if (key.startsWith(prefix)) keys.push(key);
        }
      }
      return { keys };
    },
    async get(key) {
      if (typeof localStorage !== "undefined") {
        const value = localStorage.getItem(key);
        return value === null ? null : { value };
      }
      return memoryStore.has(key) ? { value: memoryStore.get(key) } : null;
    },
    async set(key, value) {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(key, value);
      } else {
        memoryStore.set(key, value);
      }
      return null;
    },
    async delete(key) {
      if (typeof localStorage !== "undefined") {
        localStorage.removeItem(key);
      } else {
        memoryStore.delete(key);
      }
      return null;
    },
  };

  return storage;
}

export const storage = getStorageAdapter();
