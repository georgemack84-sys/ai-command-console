import type { SamActionType, SamApprovalResult, SamDryRunResult, SamPreflightResult } from "./samTypes";

export const SAM_MODE = "bridge" as const;

export const SAM_ACTION_TYPES: SamActionType[] = [
  "recover_execution",
  "pause_execution",
  "resume_execution",
  "cancel_execution",
  "export_evidence",
  "add_operator_note",
  "inspect_state",
  "unknown",
];

export const SAM_READ_ONLY_ACTIONS: SamActionType[] = [
  "export_evidence",
  "inspect_state",
];

export const SAM_AUDIT_EVENTS = [
  "sam.proposal.created",
  "sam.preflight.passed",
  "sam.preflight.failed",
  "sam.approval.required",
  "sam.approval.granted",
  "sam.approval.denied",
  "sam.dry_run.generated",
  "sam.bridge.blocked",
  "sam.bridge.completed",
] as const;

export const SAM_OPERATOR_ACTION_MAP: Record<string, string | null> = {
  add_operator_note: "ADD_NOTE",
  export_evidence: "VIEW_EVIDENCE",
  inspect_state: "VIEW_EVIDENCE",
  recover_execution: null,
  pause_execution: null,
  resume_execution: null,
  cancel_execution: null,
  unknown: null,
};

export const DEFAULT_SAM_PREFLIGHT: SamPreflightResult = {
  allowed: false,
  blocked: true,
  reason: "SAM_PREFLIGHT_FAILED",
  checks: {
    readModelAvailable: false,
    operatorActionAllowed: false,
    evidenceValid: false,
    timelineConsistent: false,
    lockValid: false,
    disputedState: true,
  },
  source: {},
};

export const DEFAULT_SAM_APPROVAL: SamApprovalResult = {
  required: true,
  granted: false,
  denied: false,
  status: "required",
  reason: "SAM_APPROVAL_REQUIRED",
};

export const DEFAULT_SAM_DRY_RUN: SamDryRunResult = {
  dryRun: true,
  executed: false,
  wouldExecute: false,
  actionType: "unknown",
  summary: "dry-run unavailable",
  expectedEffects: [],
  blockedEffects: [],
};
