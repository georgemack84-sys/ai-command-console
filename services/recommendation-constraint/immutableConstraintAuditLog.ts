import { appendImmutableLedgerEntry } from "@/services/audit/immutableAuditLedger";
import type { ConstraintAuditRecord, RecommendationConstraintLedgerEntry } from "./types/recommendationConstraintTypes";

export function appendConstraintAuditLedgerEntry(input: {
  existing?: readonly RecommendationConstraintLedgerEntry[];
  payload: Readonly<Record<string, unknown>>;
  scope: string;
}): readonly RecommendationConstraintLedgerEntry[] {
  const previousHash = input.existing?.at(-1)?.entryHash ?? null;
  const entry = appendImmutableLedgerEntry({
    payload: input.payload,
    previousHash,
    scope: input.scope,
  });
  return Object.freeze([...(input.existing ?? []), entry]);
}

export function buildConstraintAuditId(record: ConstraintAuditRecord): string {
  return `${record.recommendationId}:${record.constraintPhase}:${record.constraintType}`;
}
