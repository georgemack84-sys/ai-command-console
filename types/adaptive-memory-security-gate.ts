export type ValidatorCriticality = "MANDATORY" | "SUPPLEMENTARY";

export type ValidatorStatus = "PASS" | "SUSPICIOUS" | "FAIL" | "INDETERMINATE";

export type FindingDispositionEffect = "INFORMATIONAL" | "QUARANTINE" | "REJECT";

export type SecurityDisposition = "VERIFIED" | "QUARANTINED" | "REJECTED";

export type SecurityFindingCategory =
  | "AUTHENTICATION"
  | "AUTHORIZATION"
  | "TENANT_ISOLATION"
  | "PROVENANCE"
  | "INTEGRITY"
  | "CRYPTOGRAPHY"
  | "TAMPERING"
  | "REPLAY"
  | "POISONING"
  | "IMMUTABILITY"
  | "LIFECYCLE"
  | "RETENTION"
  | "VALIDATOR_ORCHESTRATION";

export type SecurityFindingSeverity = "INFORMATIONAL" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type EvidenceReference = Readonly<{
  evidenceId: string;
  evidenceType: string;
  integrityHash: string;
}>;

export type NormalizedSecurityFact = Readonly<{
  factId: string;
  factType: string;
  valueHash: string;
}>;

export type SecurityFinding = Readonly<{
  findingId: string;
  tenantId: string;
  memoryId: string;
  validatorId: string;
  category: SecurityFindingCategory;
  severity: SecurityFindingSeverity;
  confidence: number;
  conclusive: boolean;
  dispositionEffect: FindingDispositionEffect;
  code: string;
  summary: string;
  normalizedEvidence: readonly EvidenceReference[];
}>;

export type SecurityValidatorResult = Readonly<{
  validatorId: string;
  validatorVersion: string;
  criticality: ValidatorCriticality;
  applicable: boolean;
  completed: boolean;
  status: ValidatorStatus;
  findings: readonly SecurityFinding[];
  evidenceReferences: readonly EvidenceReference[];
  normalizedFacts: readonly NormalizedSecurityFact[];
  deterministicInputHash: string;
  deterministicOutputHash: string;
}>;

export type ResolvedValidatorRequirement = Readonly<{
  validatorId: string;
  validatorVersion: string;
  criticality: ValidatorCriticality;
  applicable: boolean;
  executionOrder: number;
  deterministicInputHash: string;
}>;

export type FindingConstructionContext = Readonly<{
  evaluationId: string;
  tenantId: string;
  memoryId: string;
  normalizerVersion: string;
}>;

export type SecurityExecutionContext = Readonly<{
  requestId: string;
  correlationId: string;
  missionId?: string;
  sourceService: string;
  evaluatingServiceVersion: string;
  policyVersion: string;
  schemaVersion: string;
  normalizerVersion: string;
  logicalEvaluationTime: string;
  wallClockObservedAt: string;
  nodeId?: string;
}>;

export type BindingRejectionReason =
  | "UNREGISTERED_VALIDATOR"
  | "VERSION_MISMATCH"
  | "CRITICALITY_MISMATCH";

export type ValidatorBindingOutcome =
  | Readonly<{
      kind: "BOUND";
      result: SecurityValidatorResult;
    }>
  | Readonly<{
      kind: "REJECTED_AS_ABSENT";
      validatorId: string;
      finding: SecurityFinding;
      rawResult: SecurityValidatorResult;
      reason: BindingRejectionReason;
    }>;

export type ResultConsistencyViolationCode =
  | "PASS_WITH_BLOCKING_FINDING"
  | "SUSPICIOUS_WITHOUT_QUARANTINE_FINDING"
  | "SUSPICIOUS_WITH_CONCLUSIVE_REJECT_FINDING"
  | "FAIL_WITHOUT_CONCLUSIVE_REJECT_FINDING"
  | "INDETERMINATE_WITHOUT_EXPLANATION"
  | "INCOMPLETE_RESULT_RETURNED_PASS";

export type ResultConsistencyValidation = Readonly<{
  consistent: boolean;
  violationCode?: ResultConsistencyViolationCode;
}>;

export type InvariantEnforcementOutcome = Readonly<{
  authoritativeResult: SecurityValidatorResult;
  forensicResult?: SecurityValidatorResult;
}>;

export type DuplicateGroupRejection = Readonly<{
  validatorId: string;
  finding: SecurityFinding;
  forensicResults: readonly SecurityValidatorResult[];
}>;

export type ValidatorAccumulationState = Readonly<{
  authoritativeResults: Map<string, SecurityValidatorResult>;
  disqualifiedValidatorIds: Set<string>;
  orchestrationFindings: SecurityFinding[];
  forensicResults: SecurityValidatorResult[];
  bindingRejections: BindingRejectionRecord[];
  duplicateGroups: DuplicateGroupRecord[];
}>;

export type BindingRejectionRecord = Readonly<{
  validatorId: string;
  reason: BindingRejectionReason;
  rawResult: SecurityValidatorResult;
  finding: SecurityFinding;
}>;

export type DuplicateGroupRecord = Readonly<{
  validatorId: string;
  forensicResults: readonly SecurityValidatorResult[];
  finding: SecurityFinding;
}>;

export type PreparedValidatorSet = Readonly<{
  authoritativeResults: readonly SecurityValidatorResult[];
  orchestrationFindings: readonly SecurityFinding[];
  forensicResults: readonly SecurityValidatorResult[];
  disqualifiedValidatorIds: readonly string[];
  authoritativeResultSetHash: string;
  forensicEvidenceHash: string;
  normalizerVersion: string;
}>;

export type FrozenNormalizedValidatorSet = PreparedValidatorSet & Readonly<{ frozen: true }>;

export type PrepareNormalizedValidatorSetContext = FindingConstructionContext &
  Readonly<{
    canonicalRequestHash: string;
    manifestVersion: string;
    validatorSetVersion: string;
  }>;

export type DeterministicFindingIdentityInput = Readonly<{
  evaluationId: string;
  tenantId: string;
  memoryId: string;
  validatorId: string;
  code: string;
  subjectFingerprint?: string;
  occurrenceIndex?: number;
}>;
