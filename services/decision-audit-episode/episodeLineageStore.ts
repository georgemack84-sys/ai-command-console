import { appendImmutableLedgerEntry } from "@/services/audit/immutableAuditLedger";
import type {
  DecisionAuditEpisodeLedgerEntry,
  DecisionAuditEpisodeLineageEntry,
  DecisionAuditEpisodeLineageLedger,
} from "./types/decisionAuditEpisodeTypes";
import { hashDecisionEpisodeValue } from "./decisionEpisodeHashEngine";

export function appendDecisionEpisodeLineage(input: {
  existing?: DecisionAuditEpisodeLineageLedger;
  entry: DecisionAuditEpisodeLineageEntry;
}): DecisionAuditEpisodeLineageLedger {
  const entries = Object.freeze([...(input.existing?.entries ?? []), input.entry]);
  return Object.freeze({
    entries,
    lineageHash: hashDecisionEpisodeValue("decision-audit-episode-lineage", entries),
  });
}

export function appendDecisionEpisodeLedger(input: {
  existing?: readonly DecisionAuditEpisodeLedgerEntry[];
  payload: Readonly<Record<string, unknown>>;
  scope: string;
}): readonly DecisionAuditEpisodeLedgerEntry[] {
  const previousHash = input.existing?.at(-1)?.entryHash ?? null;
  const entry = appendImmutableLedgerEntry({
    payload: input.payload,
    previousHash,
    scope: input.scope,
  });
  return Object.freeze([...(input.existing ?? []), entry]);
}
