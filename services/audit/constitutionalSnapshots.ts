import type { ExpandedConstitutionalAuditRecord } from "../../types/audit";

export function buildConstitutionalSnapshot(record: ExpandedConstitutionalAuditRecord) {
  return {
    snapshotId: `snapshot:${record.auditId}`,
    governanceAction: record.governanceAction,
    constitutionalState: record.constitutionalState,
    immutableHash: record.immutableHash,
    timestamp: record.timestamp,
  };
}
