"use client";

import { useEffect } from "react";
import { useRealtime } from "./realtime-provider";

export function useBillRealtimeReconciliation(billId: string | null, reconcile: () => void): void {
  const { subscribe } = useRealtime();
  useEffect(() => subscribe((event) => {
    if ((!billId || event.data.billId === billId)) reconcile();
  }), [billId, reconcile, subscribe]);
}
