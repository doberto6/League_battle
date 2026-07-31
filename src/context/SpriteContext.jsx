import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "../lib/api";

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
        const entries = await api.listSprites();
        setSprites(entries || {});
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
      await api.saveSprite(championId, dataUri);
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
      await api.deleteSprite(championId);
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
