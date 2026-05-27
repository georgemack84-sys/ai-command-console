import type { ExecutionCompatibilityContract } from "../execution-compatibility";
import type { ExecutionTruthPackage } from "../execution-truth";
import type { NormalizedPlan } from "../normalization";
import type { SimulationReadiness, SimulationResult } from "../simulation";
import type { VersionedReplayArtifact } from "../versioning";

export type AdmissionDecision =
  | "APPROVED"
  | "DENIED"
  | "ESCALATED"
  | "PAUSED"
  | "QUARANTINED"
  | "SIMULATION_REQUIRED"
  | "REVALIDATION_REQUIRED"
  | "REVOKED";

export type TrustZone =
  | "SANDBOX"
  | "RESTRICTED"
  | "STANDARD"
  | "ELEVATED"
  | "CRITICAL"
  | "STRATEGIC";

export type AdmissionFailureCode =
  | "PHASE42L_CONTEXT_MISSING"
  | "PHASE42L_LINEAGE_MISSING"
  | "PHASE42L_LINEAGE_DRIFT"
  | "PHASE42L_RUNTIME_DRIFT"
  | "PHASE42L_GOVERNANCE_CONFLICT"
  | "PHASE42L_APPROVAL_MISSING"
  | "PHASE42L_SIMULATION_REQUIRED"
  | "PHASE42L_TRUST_ZONE_VIOLATION"
  | "PHASE42L_UNSUPPORTED_DECISION_STATE"
  | "PHASE42L_MUTATION_ATTEMPT_BLOCKED"
  | "PHASE42L_ADMISSION_HASH_MISMATCH"
  | "PHASE42L_REVALIDATION_REQUIRED";

export type AdmissionLineageAnchors = Readonly<{
  executionTruthHash: string;
  executionCompatibilityHash: string;
  replaySnapshotHash: string;
  derivedSimulationHash?: string;
}>;

export type AdmissionContext = Readonly<{
  planHash: string;
  lineage: AdmissionLineageAnchors;
  governanceSnapshotHash: string;
  approvalChainHash: string;
  runtimeSnapshotHash: string;
  trustZone: TrustZone;
  requestedAt: string;
}>;

export type AdmissionFailure = Readonly<{
  code: AdmissionFailureCode;
  message: string;
  path?: string;
}>;

export type AdmissionResult = Readonly<{
  decision: AdmissionDecision;
  derivedAdmissionHash: string;
  reasons: readonly string[];
  blocks: readonly string[];
  warnings: readonly string[];
  contextHash: string;
}>;

export type RuntimeReadinessMetadata = Readonly<{
  runtimeSnapshotHash: string;
  healthy: boolean;
  stale?: boolean;
  lockConflict?: boolean;
  leaseConflict?: boolean;
  mutationAttempted?: boolean;
  governanceEpoch?: string;
  expectedGovernanceEpoch?: string;
}>;

export type GovernanceMetadata = Readonly<{
  governanceSnapshotHash: string;
  approvalChainHash: string;
  approvalsSatisfied: boolean;
  conflicts?: readonly string[];
  allowedTrustZones?: readonly TrustZone[];
  currentTrustZone?: TrustZone;
  requiredSimulation?: boolean;
}>;

export type AdmissionRuntimeReadiness = Readonly<{
  ready: boolean;
  shouldPause: boolean;
  requiresRevalidation: boolean;
  failures: readonly AdmissionFailure[];
  warnings: readonly string[];
}>;

export type AdmissionLineageValidation = Readonly<{
  ok: boolean;
  failures: readonly AdmissionFailure[];
}>;

export type GovernanceSupervision = Readonly<{
  status: "STABLE" | "PAUSE_RECOMMENDED" | "ESCALATION_RECOMMENDED" | "REVOCATION_RECOMMENDED";
  reasons: readonly string[];
}>;

export type AdmissionRevocation = Readonly<{
  decision: "REVOKED" | "UNCHANGED";
  reasons: readonly string[];
  lineage: AdmissionLineageAnchors;
  derivedRevocationHash: string;
}>;

export type TrustZoneEnforcement = Readonly<{
  allowed: boolean;
  requiresRevalidation: boolean;
  failures: readonly AdmissionFailure[];
  warnings: readonly string[];
}>;

export type AdmissionBuildInput = Readonly<{
  normalizedPlan: NormalizedPlan;
  executionTruthPackage: ExecutionTruthPackage;
  executionCompatibilityContract: ExecutionCompatibilityContract;
  versionedReplayArtifact: VersionedReplayArtifact;
  simulationReadiness?: SimulationReadiness;
  simulationResult?: SimulationResult;
  governanceMetadata: GovernanceMetadata;
  runtimeMetadata: RuntimeReadinessMetadata;
  requestedTrustZone?: TrustZone;
  requestedAt?: string;
  expectedLineage?: Partial<AdmissionLineageAnchors>;
}>;

export type AdmissionReadiness = Readonly<{
  context: AdmissionContext;
  lineage: AdmissionLineageValidation;
  runtime: AdmissionRuntimeReadiness;
  trustZone: TrustZoneEnforcement;
  supervision: GovernanceSupervision;
  result: AdmissionResult;
}>;
