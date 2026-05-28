import type {
  AuthorityBoundaryError,
  AuthorityLineageRecord,
  ConstitutionalAuthorityBoundaryInput,
} from "./authorityBoundaryTypes";
import { hashAuthorityValue } from "./authorityHashingEngine";

export function validateAuthorityLineage(input: ConstitutionalAuthorityBoundaryInput): {
  record: AuthorityLineageRecord;
  errors: readonly AuthorityBoundaryError[];
} {
  const gate = input.controlledAutonomyReadinessGateResult;
  const errors: AuthorityBoundaryError[] = [];
  if (gate.constitutionalReadiness.lineage.entries.length === 0) {
    errors.push(Object.freeze({
      code: "CONSTITUTIONAL_AUTHORITY_LINEAGE_MISSING",
      message: "Authority reconstruction requires immutable readiness lineage.",
      path: "controlledAutonomyReadinessGateResult.constitutionalReadiness.lineage.entries",
    }));
  }

  const record: AuthorityLineageRecord = Object.freeze({
    lineageId: hashAuthorityValue("constitutional-authority-lineage-id", input.boundaryId),
    authorityClass: input.requestedAuthorityClass,
    governanceSnapshotId: gate.record.governanceSnapshotId,
    replaySnapshotId: gate.record.replaySnapshotId,
    approvalLineageBound: gate.domainCertifications.some((item) => item.domain === "approval" && item.classification === "VERIFIED"),
    escalationLineageBound: gate.domainCertifications.some((item) => item.domain === "escalation" && item.classification === "VERIFIED"),
    deterministicHash: hashAuthorityValue("constitutional-authority-lineage-record", {
      boundaryId: input.boundaryId,
      authorityClass: input.requestedAuthorityClass,
      governanceSnapshotId: gate.record.governanceSnapshotId,
      replaySnapshotId: gate.record.replaySnapshotId,
    }),
  });

  if (!record.approvalLineageBound || !record.escalationLineageBound) {
    errors.push(Object.freeze({
      code: "CONSTITUTIONAL_AUTHORITY_INHERITANCE_AMBIGUOUS",
      message: "Approval or escalation lineage binding is incomplete for authority inheritance.",
      path: "controlledAutonomyReadinessGateResult.domainCertifications",
    }));
  }

  return Object.freeze({
    record,
    errors: Object.freeze(errors),
  });
}
