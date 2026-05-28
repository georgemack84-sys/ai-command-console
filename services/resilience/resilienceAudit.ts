import type { ConstitutionalResilienceAssessment, ResilienceAuditRecord, ResilienceLineage } from "./resilienceTypes";

export function buildResilienceAudit({
  assessment,
  lineage,
}: {
  assessment: ConstitutionalResilienceAssessment;
  lineage: ResilienceLineage;
}): ResilienceAuditRecord {
  return {
    eventType: "resilience.assessed",
    resilienceState: assessment.resilienceState,
    evidence: lineage.evidence,
    violations: assessment.resilienceViolations,
    affectedSubsystems: assessment.affectedSubsystems,
    timestamp: assessment.generatedAt,
  };
}

export function buildConstitutionalResilienceAuditRecord(input: {
  assessment: {
    resilienceState: string;
  };
  continuity: {
    mode: string;
    protectedDomains: string[];
  };
  collapsePrevention: {
    containmentActions: string[];
  };
  sourceAuditId: string;
  createdAt: number;
}) {
  return {
    auditId: `resilience-audit:${input.createdAt}`,
    sourceAuditId: input.sourceAuditId,
    resilienceState: input.assessment.resilienceState,
    continuityMode: input.continuity.mode,
    protectedDomains: input.continuity.protectedDomains,
    containmentActions: input.collapsePrevention.containmentActions,
    advisoryOnly: true as const,
    createdAt: input.createdAt,
  };
}
