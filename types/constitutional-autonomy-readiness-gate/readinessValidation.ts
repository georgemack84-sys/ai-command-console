import type { ConstitutionalReadinessLevel, ReadinessAutonomyState } from "./readinessState";

export type SafeActionProposal = Readonly<{
  proposalId: string;
  autonomyLevel: "A0" | "A1" | "A2";
  actionType: string;
  riskLevel: string;
  confidenceScore: number;
  approvalRequired: boolean;
  governanceBindings: readonly string[];
  replaySnapshotId: string;
  createdAt: string;
}>;

export type ApprovalDependency = Readonly<{
  dependencyId: string;
  proposalId: string;
  requiredApprovalType: string;
  status: "pending" | "approved" | "denied" | "revoked";
  expiresAt?: string;
}>;

export type ReadinessValidation = Readonly<{
  validationId: string;
  readinessLevel: ConstitutionalReadinessLevel;
  autonomyState: ReadinessAutonomyState;
  replayValid: boolean;
  governanceValid: boolean;
  approvalValid: boolean;
  overrideValid: boolean;
  escalationValid: boolean;
  containmentValid: boolean;
  confidenceValid: boolean;
  hiddenExecutionAbsent: boolean;
  driftDetected: boolean;
  reasons: readonly string[];
  createdAt: string;
}>;
