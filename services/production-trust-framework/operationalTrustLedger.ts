import { hashFailurePayload } from "@/services/failure-orchestration";
import type { ProductionTrustLedgerEvent } from "./productionTrustTypes";

export function appendOperationalTrustEvent(
  ledger: readonly ProductionTrustLedgerEvent[],
  event: Omit<ProductionTrustLedgerEvent, "eventHash">,
): readonly ProductionTrustLedgerEvent[] {
  const finalized: ProductionTrustLedgerEvent = {
    ...event,
    eventHash: hashFailurePayload("EVIDENCE_BUNDLE", {
      ...event,
      priorHashes: ledger.map((entry) => entry.eventHash),
    }),
  };
  return [...ledger, finalized];
}
