import type { FailureOrchestrationInput, FailureOrchestrationResult } from "@/services/failure-orchestration";

export const ENFORCEMENT_HARNESS_ERROR_CODES = {
  TOOL_IDENTITY_SPOOF_DETECTED: "TOOL_IDENTITY_SPOOF_DETECTED",
  TOOL_ALIAS_COLLISION: "TOOL_ALIAS_COLLISION",
  TOOL_VERSION_DRIFT: "TOOL_VERSION_DRIFT",
  REGISTRY_SHADOWING_DETECTED: "REGISTRY_SHADOWING_DETECTED",
  GOVERNANCE_BYPASS_ATTEMPT: "GOVERNANCE_BYPASS_ATTEMPT",
  POLICY_MUTATION_DETECTED: "POLICY_MUTATION_DETECTED",
  UNAUTHORIZED_PRIVILEGE_ESCALATION: "UNAUTHORIZED_PRIVILEGE_ESCALATION",
  AUDIT_SUPPRESSION_ATTEMPT: "AUDIT_SUPPRESSION_ATTEMPT",
  REPLAY_REGISTRY_DRIFT: "REPLAY_REGISTRY_DRIFT",
  REPLAY_POLICY_MISMATCH: "REPLAY_POLICY_MISMATCH",
  REPLAY_SCHEMA_MISMATCH: "REPLAY_SCHEMA_MISMATCH",
  REPLAY_HASH_INVALID: "REPLAY_HASH_INVALID",
  RUNTIME_INJECTION_DETECTED: "RUNTIME_INJECTION_DETECTED",
  PLUGIN_IMPERSONATION_DETECTED: "PLUGIN_IMPERSONATION_DETECTED",
  SANDBOX_ESCAPE_ATTEMPT: "SANDBOX_ESCAPE_ATTEMPT",
  UNAUTHORIZED_DYNAMIC_EXECUTION: "UNAUTHORIZED_DYNAMIC_EXECUTION",
  FREEZE_BYPASS_ATTEMPT: "FREEZE_BYPASS_ATTEMPT",
  RECOVERY_ESCALATION_ATTEMPT: "RECOVERY_ESCALATION_ATTEMPT",
  FORGED_RECOVERY_MANIFEST: "FORGED_RECOVERY_MANIFEST",
  TRUST_REHYDRATION_SPOOF: "TRUST_REHYDRATION_SPOOF",
  FAILURE_SNAPSHOT_TAMPERED: "FAILURE_SNAPSHOT_TAMPERED",
  CERTIFICATION_BLOCKED: "CERTIFICATION_BLOCKED",
} as const;

export type EnforcementHarnessErrorCode =
  typeof ENFORCEMENT_HARNESS_ERROR_CODES[keyof typeof ENFORCEMENT_HARNESS_ERROR_CODES];

export type EnforcementAttackCategory =
  | "identity"
  | "governance"
  | "replay"
  | "runtime"
  | "freeze"
  | "recovery"
  | "survivability"
  | "snapshot"
  | "forensic"
  | "certification";

export type AttackExpectedOutcome =
  | "DENIED"
  | "CONTAINED"
  | "SNAPSHOT_REJECTED"
  | "REPLAY_REJECTED"
  | "CERTIFICATION_FAILED"
  | "FORENSIC_RECONSTRUCTED";

export type EnforcementScenarioDefinition = Readonly<{
  scenarioId: string;
  category: EnforcementAttackCategory;
  expectedOutcome: AttackExpectedOutcome;
  errorCode?: EnforcementHarnessErrorCode;
  description: string;
  mutateInput?: (input: FailureOrchestrationInput) => FailureOrchestrationInput;
  verifyResult?: (result: FailureOrchestrationResult) => boolean;
  verifyReplaySafe?: (result: FailureOrchestrationResult) => boolean;
}>;

export type ForensicTimelineEntry = Readonly<{
  step: number;
  phase: "input" | "signal" | "containment" | "snapshot" | "recovery" | "decision";
  label: string;
  hash: string;
}>;

export type ForensicTimeline = Readonly<{
  scenarioId: string;
  entries: readonly ForensicTimelineEntry[];
  timelineHash: string;
}>;

export type FailureSnapshotVerificationResult = Readonly<{
  valid: boolean;
  snapshotHash: string;
  errorCode?: EnforcementHarnessErrorCode;
  details: readonly string[];
}>;

export type EnforcementHarnessEvidence = Readonly<{
  resultHash: string;
  signalCount: number;
  containmentCount: number;
  runtimeMode: string;
  trustState: string;
  snapshotHash: string;
  timelineHash?: string;
  details: Readonly<Record<string, unknown>>;
}>;

export type EnforcementHarnessResult = Readonly<{
  scenarioId: string;
  category: EnforcementAttackCategory;
  expectedOutcome: AttackExpectedOutcome;
  actualOutcome: AttackExpectedOutcome;
  denied: boolean;
  contained: boolean;
  deterministic: boolean;
  replaySafe: boolean;
  forensicSnapshotHash: string;
  certificationEligible: boolean;
  errorCode?: EnforcementHarnessErrorCode;
  evidence: EnforcementHarnessEvidence;
}>;

export type TrustCertificationInput = Readonly<{
  results: readonly EnforcementHarnessResult[];
}>;

export type TrustCertificationResult = Readonly<{
  certified: boolean;
  certificationEligible: boolean;
  errorCode?: EnforcementHarnessErrorCode;
  resultHash: string;
  failedScenarioIds: readonly string[];
}>;
