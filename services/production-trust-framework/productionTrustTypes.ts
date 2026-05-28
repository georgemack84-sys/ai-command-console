import type { FailureOrchestrationResult } from "@/services/failure-orchestration";
import type {
  EnforcementHarnessResult,
  TrustCertificationResult,
} from "@/services/enforcement-test-harness";
import type { RegistrySnapshot } from "@/services/registry-snapshots";
import type { RegistryTrustAdmissionResult } from "@/services/registry-trust";
import type { RuntimeValidationResult } from "@/services/runtime-validation";

export const PRODUCTION_TRUST_ERROR_CODES = {
  TOOL_UNREGISTERED: "TOOL_UNREGISTERED",
  TOOL_VERSION_MISMATCH: "TOOL_VERSION_MISMATCH",
  TOOL_POLICY_INVALID: "TOOL_POLICY_INVALID",
  TOOL_GOVERNANCE_METADATA_MISSING: "TOOL_GOVERNANCE_METADATA_MISSING",
  TOOL_RUNTIME_UNSUPPORTED: "TOOL_RUNTIME_UNSUPPORTED",
  TOOL_CAPABILITY_VIOLATION: "TOOL_CAPABILITY_VIOLATION",
  TOOL_RESOLUTION_AMBIGUOUS: "TOOL_RESOLUTION_AMBIGUOUS",
  REGISTRY_INTEGRITY_FAILURE: "REGISTRY_INTEGRITY_FAILURE",
  REPLAY_REGISTRY_MISMATCH: "REPLAY_REGISTRY_MISMATCH",
  TOOL_EXECUTION_BLOCKED: "TOOL_EXECUTION_BLOCKED",
  REGISTRY_CERTIFICATION_FAILED: "REGISTRY_CERTIFICATION_FAILED",
  GOVERNANCE_BYPASS_DETECTED: "GOVERNANCE_BYPASS_DETECTED",
  TOOL_PRIVILEGE_ESCALATION: "TOOL_PRIVILEGE_ESCALATION",
  TOOL_SANDBOX_VIOLATION: "TOOL_SANDBOX_VIOLATION",
  DEPLOYMENT_TRUST_REVOKED: "DEPLOYMENT_TRUST_REVOKED",
  PRODUCTION_DRIFT_DETECTED: "PRODUCTION_DRIFT_DETECTED",
  RECERTIFICATION_REQUIRED: "RECERTIFICATION_REQUIRED",
  RECOVERY_VALIDATION_FAILED: "RECOVERY_VALIDATION_FAILED",
  AUTONOMOUS_DEPLOYMENT_DENIED: "AUTONOMOUS_DEPLOYMENT_DENIED",
  CERTIFICATION_EXPIRED: "CERTIFICATION_EXPIRED",
  CERTIFICATION_SIGNATURE_INVALID: "CERTIFICATION_SIGNATURE_INVALID",
  CERTIFICATION_AUTHORITY_UNKNOWN: "CERTIFICATION_AUTHORITY_UNKNOWN",
  PRODUCTION_FREEZE_REQUIRED: "PRODUCTION_FREEZE_REQUIRED",
  COMPLIANCE_EVIDENCE_INVALID: "COMPLIANCE_EVIDENCE_INVALID",
} as const;

export type ProductionTrustErrorCode =
  typeof PRODUCTION_TRUST_ERROR_CODES[keyof typeof PRODUCTION_TRUST_ERROR_CODES];

export type ProductionTrustError = Readonly<{
  code: ProductionTrustErrorCode;
  message: string;
  path?: string;
  expected?: unknown;
  actual?: unknown;
}>;

export type ProductionCertificationStatus =
  | "certified"
  | "denied"
  | "revoked"
  | "requires_recertification";

export type ProductionTrustEvidence = Readonly<{
  productionTrustId: string;
  certificationId: string;
  registryHash: string;
  certificationHash: string;
  replayValidation: Readonly<{ valid: boolean; hash: string }>;
  governanceValidation: Readonly<{ valid: boolean; hash: string }>;
  integrityValidation: Readonly<{ valid: boolean; hash: string }>;
  adversarialValidation: Readonly<{ valid: boolean; hash: string }>;
  survivabilityValidation: Readonly<{ valid: boolean; hash: string }>;
  revocationStatus: ProductionCertificationStatus;
  forensicTimelineHash: string;
  generatedAt: string;
  evidenceHash: string;
}>;

export type ProductionCertificationRecord = Readonly<{
  certificationId: string;
  registryHash: string;
  governanceHash: string;
  replayHash: string;
  integrityHash: string;
  adversarialCertificationHash: string;
  issuedAt: string;
  expiresAt: string;
  certifiedBy: string;
  certificationStatus: ProductionCertificationStatus;
  certificationHash: string;
}>;

export type DeploymentAttestation = Readonly<{
  productionTrustId: string;
  registryHash: string;
  certificationHash: string;
  approvalChainHash: string;
  trustBoundary: string;
  environmentId: string;
  deploymentConstraints: readonly string[];
  rollbackRequired: boolean;
  evidenceHash: string;
}>;

export type CertificationRevocationReason =
  | "REGISTRY_INTEGRITY_FAILURE"
  | "REPLAY_REGISTRY_MISMATCH"
  | "GOVERNANCE_BYPASS_DETECTED"
  | "PRODUCTION_DRIFT_DETECTED"
  | "TOOL_PRIVILEGE_ESCALATION"
  | "TOOL_SANDBOX_VIOLATION"
  | "CERTIFICATION_EXPIRED"
  | "MANUAL_GOVERNANCE_REVOKE";

export type CertificationRevocationRecord = Readonly<{
  certificationId: string;
  reason: CertificationRevocationReason;
  revokedAt: string;
  revokedBy: string;
  revocationHash: string;
}>;

export type ContinuousTrustRecommendation =
  | "freeze"
  | "recertification"
  | "deny"
  | "continue";

export type ContinuousTrustMonitorResult = Readonly<{
  healthy: boolean;
  recommendation: ContinuousTrustRecommendation;
  errorCode?: ProductionTrustErrorCode;
  driftDetected: boolean;
  resultHash: string;
}>;

export type ProductionFreezeDecision = Readonly<{
  freeze: boolean;
  reasonCode?: ProductionTrustErrorCode;
  reason: string;
  freezeHash: string;
}>;

export type ProductionTrustAuthorityResult = Readonly<{
  trusted: boolean;
  error?: ProductionTrustError;
  resultHash: string;
}>;

export type ProductionReadinessStatus =
  | "certified"
  | "denied"
  | "revoked"
  | "requires_recertification";

export type ProductionReadinessResult = Readonly<{
  certified: boolean;
  status: ProductionReadinessStatus;
  productionTrustId: string;
  registryHash: string;
  certificationHash: string;
  replayVerified: boolean;
  governanceVerified: boolean;
  integrityVerified: boolean;
  survivabilityVerified: boolean;
  adversarialValidationPassed: boolean;
  failClosedVerified: boolean;
  errors: readonly ProductionTrustError[];
  evidence: ProductionTrustEvidence;
}>;

export type ProductionTrustLedgerEvent = Readonly<{
  eventType:
    | "certification.created"
    | "certification.denied"
    | "certification.revoked"
    | "certification.expired"
    | "trust.monitor.detected_drift"
    | "trust.freeze.recommended"
    | "trust.recertification.required"
    | "attestation.created"
    | "compliance.evidence.generated";
  productionTrustId: string;
  certificationId?: string;
  result: "success" | "failure";
  errorCode?: ProductionTrustErrorCode;
  eventHash: string;
  occurredAt?: string;
}>;

export type ReplayTrustValidationResult = Readonly<{
  valid: boolean;
  replayHash: string;
  errors: readonly ProductionTrustError[];
}>;

export type GovernanceContinuityValidationResult = Readonly<{
  valid: boolean;
  governanceHash: string;
  errors: readonly ProductionTrustError[];
}>;

export type SurvivabilityCertificationResult = Readonly<{
  valid: boolean;
  survivabilityHash: string;
  errors: readonly ProductionTrustError[];
}>;

export type ProductionCertificationInput = Readonly<{
  snapshot: RegistrySnapshot;
  trustedSnapshotAdmission: RegistryTrustAdmissionResult;
  runtimeValidation: RuntimeValidationResult;
  failureState: FailureOrchestrationResult;
  harnessResults: readonly EnforcementHarnessResult[];
  trustCertification: TrustCertificationResult;
  issuedAt: string;
  expiresAt: string;
  certifiedBy: string;
}>;

export type ProductionReadinessInput = Readonly<{
  snapshot: RegistrySnapshot;
  trustedSnapshotAdmission: RegistryTrustAdmissionResult;
  runtimeValidation: RuntimeValidationResult;
  failureState: FailureOrchestrationResult;
  harnessResults: readonly EnforcementHarnessResult[];
  trustCertification: TrustCertificationResult;
  certification: ProductionCertificationRecord;
  currentTime: string;
  authorityId: string;
  authorityStatus: "known" | "unknown";
  attestationApprovalChainHash: string;
  environmentId: string;
  deploymentConstraints: readonly string[];
  rollbackRequired: boolean;
  currentRegistryHash?: string;
  currentReplayHash?: string;
  currentGovernanceHash?: string;
  currentIntegrityHash?: string;
  autonomousDeploymentRequested?: boolean;
  revocation?: CertificationRevocationRecord;
}>;

