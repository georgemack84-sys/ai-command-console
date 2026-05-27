import type { TenantContext } from "../tenancy/tenantTypes";

export type SamActionType =
  | "recover_execution"
  | "pause_execution"
  | "resume_execution"
  | "cancel_execution"
  | "export_evidence"
  | "add_operator_note"
  | "inspect_state"
  | "unknown";

export type SamRiskLevel = "low" | "medium" | "high" | "critical";

export type SamApprovalStatus = "required" | "granted" | "denied" | "not_applicable";

export type SamBridgeMode = "bridge";

export type SamPipelineStage =
  | "proposal"
  | "preflight"
  | "approval"
  | "dry_run"
  | "audit"
  | "blocked"
  | "completed";

export type SamProposal = {
  proposalId: string;
  executionId: string;
  attemptId: string;
  actionType: SamActionType;
  requestedBy: "ai" | "operator" | "system";
  reason: string;
  riskLevel: SamRiskLevel;
  confidence: number;
  params: Record<string, unknown>;
  createdAt: string;
  tenantContext?: TenantContext;
};

export type SamPreflightResult = {
  allowed: boolean;
  blocked: boolean;
  reason?: string;
  checks: {
    readModelAvailable: boolean;
    operatorActionAllowed: boolean;
    evidenceValid: boolean;
    timelineConsistent?: boolean;
    lockValid?: boolean;
    disputedState: boolean;
  };
  source: {
    readModel?: string;
    operatorView?: string;
    evidence?: string;
    timeline?: string;
  };
};

export type SamApprovalResult = {
  required: boolean;
  granted: boolean;
  denied: boolean;
  status: SamApprovalStatus;
  approvedBy?: string;
  reason?: string;
};

export type SamDryRunResult = {
  dryRun: true;
  executed: false;
  wouldExecute: boolean;
  actionType: SamActionType;
  summary: string;
  expectedEffects: string[];
  blockedEffects: string[];
};

export type SamAuditResult = {
  attempted: boolean;
  appended: boolean;
  auditId?: string;
  skipped?: boolean;
  reason?: string;
};

export type SamError = {
  code: string;
  message: string;
  stage: SamPipelineStage;
  recoverable: boolean;
};

export type SamBridgeResult = {
  ok: boolean;
  mode: SamBridgeMode;
  proposalId: string;
  executionId: string;
  tenantId?: string;
  workspaceId?: string;
  attemptId?: string;
  idempotencyKey?: string;
  stage: SamPipelineStage;
  blocked: boolean;
  reason?: string;
  preflight: SamPreflightResult;
  approval: SamApprovalResult;
  dryRun: SamDryRunResult;
  audit: SamAuditResult;
  errors: SamError[];
};

export type SamProposalValidationResult =
  | {
      ok: true;
      data: SamProposal;
      errors: SamError[];
    }
  | {
      ok: false;
      errors: SamError[];
    };

export type SamFeatureFlags = {
  enabled: boolean;
  dryRun: boolean;
  requireApproval: boolean;
  interceptLegacyExecution: boolean;
  enableAutoApproval: boolean;
  realExecutionEnabled: false;
  safeMode: true;
  samIdempotencyEnabled: boolean;
  samRetrySafetyEnabled: boolean;
  samAuditDeduplicationEnabled: boolean;
  samDurableIdempotencyEnabled: boolean;
};
