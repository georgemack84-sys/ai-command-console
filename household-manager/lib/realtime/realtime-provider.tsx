"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { type PropriumEvent, type RealtimeConnectionStatus } from "./contracts";
import { PropriumRealtimeClient } from "./proprium-realtime-client";

type RealtimeContextValue = {
  status: RealtimeConnectionStatus;
  lastEventAt: Date | null;
  subscribe(handler: (event: PropriumEvent) => void): () => void;
};

const RealtimeContext = createContext<RealtimeContextValue | null>(null);

export function RealtimeProvider({ children, endpoint, householdId }: { children: ReactNode; endpoint: string; householdId: string | null }) {
  const [status, setStatus] = useState<RealtimeConnectionStatus>("DISCONNECTED");
  const [lastEventAt, setLastEventAt] = useState<Date | null>(null);
  const [client, setClient] = useState<PropriumRealtimeClient | null>(null);

  useEffect(() => {
    if (!householdId) return;
    const nextClient = new PropriumRealtimeClient({ endpoint, householdId });
    const unsubscribeStatus = nextClient.onStatus(setStatus);
    const unsubscribeEvent = nextClient.onEvent(() => setLastEventAt(new Date()));
    setClient(nextClient);
    nextClient.connect();
    return () => {
      unsubscribeEvent();
      unsubscribeStatus();
      nextClient.disconnect();
      setClient(null);
    };
  }, [endpoint, householdId]);

  const value = useMemo<RealtimeContextValue>(() => ({
    status,
    lastEventAt,
    subscribe: (handler) => client?.onEvent(handler) ?? (() => undefined),
  }), [client, lastEventAt, status]);

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}

export function useRealtime(): RealtimeContextValue {
  const context = useContext(RealtimeContext);
  if (!context) throw new Error("useRealtime must be used within RealtimeProvider.");
  return context;
}
