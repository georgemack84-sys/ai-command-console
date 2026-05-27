import { appendImmutableLedgerEntry } from "@/services/audit/immutableAuditLedger";
import type {
  SimulationLedgerEntry,
  SimulationLineageEntry,
  SimulationLineageLedger,
} from "./simulationStateTypes";
import { hashSimulationValue } from "./simulationTraceHasher";

export function appendSimulationLineage(input: {
  existing?: SimulationLineageLedger;
  entry: SimulationLineageEntry;
}): SimulationLineageLedger {
  const entries = Object.freeze([...(input.existing?.entries ?? []), Object.freeze(input.entry)]);
  return Object.freeze({
    entries,
    lineageHash: hashSimulationValue("constitutional-runtime-simulation-lineage", entries),
  });
}

export function appendSimulationLedger(input: {
  existing?: readonly SimulationLedgerEntry[];
  payload: Readonly<Record<string, unknown>>;
  scope: string;
}): readonly SimulationLedgerEntry[] {
  const previousHash = input.existing && input.existing.length > 0
    ? input.existing[input.existing.length - 1]?.entryHash ?? null
    : null;
  const entry = appendImmutableLedgerEntry({
    payload: input.payload,
    previousHash,
    scope: input.scope,
  });
  return Object.freeze([...(input.existing ?? []), Object.freeze(entry)]);
}
