"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { SessionUser } from "@/src/lib/types";

type AppContextValue = {
  user: SessionUser | null;
  authLoading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
};

const AppContext = createContext<AppContextValue | null>(null);

async function fetchJson<T>(url: string, init?: RequestInit) {
  const response = await fetch(url, init);
  return {
    ok: response.ok,
    status: response.status,
    body: (await response.json()) as T,
  };
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const session = await fetchJson<{ user: SessionUser | null }>("/api/auth/session");
        if (!cancelled) {
          setUser(session.body.user);
        }
      } finally {
        if (!cancelled) {
          setAuthLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      user,
      authLoading,
      isAuthenticated: Boolean(user),
      logout: async () => {
        await fetchJson("/api/auth/logout", { method: "POST" });
        setUser(null);
      },
    }),
    [authLoading, user],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppSession() {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error("useAppSession must be used within AppProvider");
  }

  return context;
}
