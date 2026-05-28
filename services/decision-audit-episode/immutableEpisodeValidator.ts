import { verifyImmutableLedgerChain } from "@/services/audit/immutableAuditLedger";
import type { DecisionAuditEpisodeError, DecisionAuditEpisodeLedgerEntry, DecisionAuditEpisodeLineageLedger, EpisodeSnapshotRecord } from "./types/decisionAuditEpisodeTypes";

export function validateImmutableEpisode(input: {
  snapshots: readonly EpisodeSnapshotRecord[];
  lineage: DecisionAuditEpisodeLineageLedger;
  auditLedger: readonly DecisionAuditEpisodeLedgerEntry[];
}): readonly DecisionAuditEpisodeError[] {
  const errors: DecisionAuditEpisodeError[] = [];
  if (!verifyImmutableLedgerChain([...input.auditLedger])) {
    errors.push({
      code: "DECISION_AUDIT_EPISODE_LINEAGE_CORRUPTION",
      message: "Decision audit episode audit ledger is not append-only.",
      path: "auditLedger",
    });
  }
  if (input.snapshots.some((snapshot) => snapshot.immutable !== true)) {
    errors.push({
      code: "DECISION_AUDIT_EPISODE_LINEAGE_CORRUPTION",
      message: "Decision audit snapshots must remain immutable.",
      path: "snapshots",
    });
  }
  if (!input.lineage.lineageHash) {
    errors.push({
      code: "DECISION_AUDIT_EPISODE_LINEAGE_CORRUPTION",
      message: "Decision audit episode lineage hash is missing.",
      path: "lineage.lineageHash",
    });
  }
  return Object.freeze(errors);
}
