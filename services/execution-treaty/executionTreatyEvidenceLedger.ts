import { hashExecutionTreatyValue } from "./executionTreatyHasher";
import type { ExecutionTreatyLedgerEvent } from "@/types/execution-treaty";

export function appendExecutionTreatyEvent(
  ledger: readonly ExecutionTreatyLedgerEvent[],
  event: Omit<ExecutionTreatyLedgerEvent, "eventHash">,
): readonly ExecutionTreatyLedgerEvent[] {
  const finalized: ExecutionTreatyLedgerEvent = {
    ...event,
    eventHash: hashExecutionTreatyValue("treaty-ledger-event", {
      ...event,
      priorHashes: ledger.map((entry) => entry.eventHash),
    }),
  };
  return [...ledger, finalized];
}
