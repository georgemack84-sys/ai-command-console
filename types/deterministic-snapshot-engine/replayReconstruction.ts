import type { PolicyDecisionExplanation } from "@/types/policy-decision-explainer";
import type { StepTraceView } from "@/types/step-trace-viewer";
import type { ExecutionTreatyPackage } from "@/types/execution-treaty";
import type { PlanDiffInspectionResult } from "@/types/plan-diff-inspector";
import type { ValidationPipelineOutput } from "@/services/validation-core";
import type { ReplayReconstructionResult } from "@/types/replay-reconstruction-engine";

export type SnapshotType =
  | "execution"
  | "policy"
  | "registry"
  | "approval"
  | "memory"
  | "validation"
  | "governance_decision"
  | "authorization"
  | "revocation"
  | "autonomy_classification"
  | "adaptation";

export type AutonomyLevel = "A0" | "A1" | "A2" | "A3" | "A4" | "A5";

export type GovernanceDecisionRecord = Readonly<{
  decisionId: string;
  decisionType: "approve" | "deny" | "override" | "revoke";
  targetArtifactId: string;
  participants: readonly string[];
  quorumSatisfied: boolean;
  rationale: string;
  timestamp: string;
  supersedes?: string;
}>;

export type AuthorizationSnapshot = Readonly<{
  authorizationId: string;
  autonomyLevel: AutonomyLevel;
  executionConstraints: readonly string[];
  supervisionRequirements: readonly string[];
  revocationRules: readonly string[];
  authorityHash: string;
  replayHash: string;
}>;

export type RevocationSnapshot = Readonly<{
  revocationId: string;
  targetArtifactId: string;
  revokedBy: readonly string[];
  revocationReason: string;
  revocationTimestamp: string;
  supersededAuthorities: readonly string[];
  replayContinuityPreserved: true;
}>;

export type AdaptationEnvelopeSnapshot = Readonly<{
  envelopeId: string;
  allowedVariations: readonly string[];
  prohibitedTransitions: readonly string[];
  supervisionRequirements: readonly string[];
  revocationTriggers: readonly string[];
  replayHash: string;
}>;

export type SnapshotSourceArtifacts = Readonly<{
  treaty?: ExecutionTreatyPackage;
  validation?: ValidationPipelineOutput;
  traceView?: StepTraceView;
  policyExplanation?: PolicyDecisionExplanation;
  diffInspection?: PlanDiffInspectionResult;
  replay?: ReplayReconstructionResult;
  governanceDecision?: GovernanceDecisionRecord;
  authorization?: AuthorizationSnapshot;
  revocation?: RevocationSnapshot;
  adaptation?: AdaptationEnvelopeSnapshot;
  sourceRefs?: readonly string[];
}>;

export type ConstitutionalSnapshotBuildInput = Readonly<{
  snapshotType: SnapshotType;
  missionId: string;
  executionId?: string;
  lineageId: string;
  parentSnapshotId?: string;
  branchId?: string;
  autonomyLevel: AutonomyLevel;
  revocationEligible?: boolean;
  supervisionRequirements?: readonly string[];
  createdAt: string;
  schemaVersion?: string;
  payload: unknown;
  sourceArtifacts: SnapshotSourceArtifacts;
}>;

export type ConstitutionalSnapshotEnvelope = Readonly<{
  snapshotId: string;
  snapshotType: SnapshotType;
  missionId: string;
  executionId?: string;
  lineageId: string;
  parentSnapshotId?: string;
  branchId?: string;
  autonomyLevel: AutonomyLevel;
  governanceHash: string;
  legalityHash: string;
  authorityHash: string;
  replayHash: string;
  payloadHash: string;
  schemaHash: string;
  integrityHash: string;
  revocationEligible: boolean;
  supervisionRequirements: readonly string[];
  immutable: true;
  createdAt: string;
  payload: unknown;
}>;
