import { hashEvidenceValue } from "./evidenceHashEngine";
import type { EvidenceConflictRecord, EvidenceReference } from "./types/evidenceAggregationTypes";

export function detectEvidenceConflicts(
  references: readonly EvidenceReference[],
): readonly EvidenceConflictRecord[] {
  const seen = new Map<string, EvidenceReference>();
  const conflicts: EvidenceConflictRecord[] = [];

  for (const reference of references) {
    const existing = seen.get(`${reference.evidenceType}:${reference.sourceId}`);
    if (existing && existing.canonicalHash !== reference.canonicalHash) {
      conflicts.push(Object.freeze({
        conflictId: `conflict:${existing.evidenceId}:${reference.evidenceId}`,
        evidenceIds: Object.freeze([existing.evidenceId, reference.evidenceId]),
        conflictType: "hash_mismatch",
        visible: true as const,
        conflictHash: hashEvidenceValue("evidence-conflict", {
          left: existing.evidenceId,
          right: reference.evidenceId,
          leftHash: existing.canonicalHash,
          rightHash: reference.canonicalHash,
        }),
      }));
      continue;
    }
    if (reference.integrityStatus !== "verified") {
      conflicts.push(Object.freeze({
        conflictId: `conflict:${reference.evidenceId}`,
        evidenceIds: Object.freeze([reference.evidenceId]),
        conflictType:
          reference.integrityStatus === "conflicted" ? "integrity_conflict" : "lineage_instability",
        visible: true as const,
        conflictHash: hashEvidenceValue("evidence-conflict", {
          evidenceId: reference.evidenceId,
          integrityStatus: reference.integrityStatus,
        }),
      }));
    }
    seen.set(`${reference.evidenceType}:${reference.sourceId}`, reference);
  }

  return Object.freeze(conflicts);
}
