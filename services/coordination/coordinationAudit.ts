import type { MultiSystemCoordinationRecord } from "../../types/coordination";

export function buildCoordinationAuditRecord(input: {
  coordinationRecord: MultiSystemCoordinationRecord;
}) {
  return {
    auditRef: `coordination:${input.coordinationRecord.coordinationId}`,
    coordinationState: input.coordinationRecord.coordinationState,
    dependencyOrdering: input.coordinationRecord.dependencyOrdering,
    auditReferences: input.coordinationRecord.auditReferences,
    timestamp: input.coordinationRecord.timestamp,
  };
}
