"use client";

import { useCallback, useEffect, useState } from "react";
import { hiddenStoriesStorageKey, parseStoredIds, savedStoriesStorageKey } from "@/lib/storage/localStories";

function useStoredIdSet(key: string) {
  const [ids, setIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    queueMicrotask(() => setIds(new Set(parseStoredIds(window.localStorage.getItem(key)))));
  }, [key]);

  const persist = useCallback(
    (next: Set<string>) => {
      window.localStorage.setItem(key, JSON.stringify([...next]));
      setIds(next);
    },
    [key],
  );

  const toggle = useCallback(
    (id: string) => {
      const next = new Set(ids);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      persist(next);
    },
    [ids, persist],
  );

  const add = useCallback(
    (id: string) => {
      const next = new Set(ids);
      next.add(id);
      persist(next);
    },
    [ids, persist],
  );

  const clear = useCallback(() => persist(new Set()), [persist]);

  return { ids, toggle, add, clear, setIds: persist };
}

export function useSavedStories() {
  const saved = useStoredIdSet(savedStoriesStorageKey);
  const hidden = useStoredIdSet(hiddenStoriesStorageKey);
  return {
    savedIds: saved.ids,
    hiddenIds: hidden.ids,
    toggleSaved: saved.toggle,
    hideStory: hidden.add,
    clearSaved: saved.clear,
    restoreHidden: hidden.clear,
    setSavedIds: saved.setIds,
    setHiddenIds: hidden.setIds,
  };
}
