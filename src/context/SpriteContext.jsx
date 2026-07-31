import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { storage } from "../storage";

const SpriteContext = createContext({
  sprites: {},
  ready: false,
  setSprite: async () => {},
  clearSprite: async () => {},
});

export function SpriteProvider({ children }) {
  const [sprites, setSprites] = useState({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const listing = await storage.list("sprite:");
        const keys = listing?.keys || [];
        const entries = {};
        for (const key of keys) {
          try {
            const result = await storage.get(key);
            if (result?.value) entries[key.slice("sprite:".length)] = result.value;
          } catch {
            // skip unreadable entries
          }
        }
        setSprites(entries);
      } catch (error) {
        console.error("Failed to load custom sprites", error);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const setSprite = useCallback(async (championId, dataUri) => {
    setSprites((current) => ({ ...current, [championId]: dataUri }));
    try {
      await storage.set(`sprite:${championId}`, dataUri);
    } catch (error) {
      console.error("Failed to save sprite", error);
    }
  }, []);

  const clearSprite = useCallback(async (championId) => {
    setSprites((current) => {
      const next = { ...current };
      delete next[championId];
      return next;
    });
    try {
      await storage.delete(`sprite:${championId}`);
    } catch (error) {
      console.error("Failed to clear sprite", error);
    }
  }, []);

  return (
    <SpriteContext.Provider value={{ sprites, ready, setSprite, clearSprite }}>
      {children}
    </SpriteContext.Provider>
  );
}

export function useSpriteContext() {
  return useContext(SpriteContext);
}
