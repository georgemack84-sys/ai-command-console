import { FAILURE_SEVERITY, type FailureSeverity } from "./failureSeverity";

export type FailureCategory =
  | "crash"
  | "timeout"
  | "deadlock"
  | "starvation"
  | "lease expiration"
  | "heartbeat loss"
  | "database unavailable"
  | "network instability"
  | "disk exhaustion"
  | "service degradation"
  | "dependency unavailable"
  | "invalid state transition"
  | "governance denial"
  | "verification mismatch"
  | "policy conflict"
  | "evidence inconsistency"
  | "operator interruption"
  | "conflicting action"
  | "approval expiration"
  | "stale execution"
  | "replay divergence";

export type FailureCategoryDefinition = {
  category: FailureCategory;
  normalizedCode: string;
  description: string;
  defaultSeverity: FailureSeverity;
  recoverable: boolean;
  requiresApproval: boolean;
  requiresEscalation: boolean;
  expectedEvidence: string[];
};

export const FAILURE_CATEGORIES: Record<FailureCategory, FailureCategoryDefinition> = {
  "crash": {
    category: "crash",
    normalizedCode: "FAILURE_RUNTIME_CRASH",
    description: "Runtime process or worker crashed.",
    defaultSeverity: FAILURE_SEVERITY.MODERATE,
    recoverable: true,
    requiresApproval: false,
    requiresEscalation: false,
    expectedEvidence: ["process:crash_dump", "execution:status=failed"],
  },
  "timeout": {
    category: "timeout",
    normalizedCode: "FAILURE_RUNTIME_TIMEOUT",
    description: "Execution or step exceeded allowed duration.",
    defaultSeverity: FAILURE_SEVERITY.LOW,
    recoverable: true,
    requiresApproval: false,
    requiresEscalation: false,
    expectedEvidence: ["timeout:step_duration_exceeded"],
  },
  "deadlock": {
    category: "deadlock",
    normalizedCode: "FAILURE_RUNTIME_DEADLOCK",
    description: "Execution appears blocked on an unresolved lock or dependency cycle.",
    defaultSeverity: FAILURE_SEVERITY.HIGH,
    recoverable: false,
    requiresApproval: true,
    requiresEscalation: true,
    expectedEvidence: ["lock:conflict", "execution:status=running"],
  },
  "starvation": {
    category: "starvation",
    normalizedCode: "FAILURE_RUNTIME_STARVATION",
    description: "Execution is not making progress despite remaining active.",
    defaultSeverity: FAILURE_SEVERITY.MODERATE,
    recoverable: true,
    requiresApproval: false,
    requiresEscalation: false,
    expectedEvidence: ["execution:no_forward_progress"],
  },
  "lease expiration": {
    category: "lease expiration",
    normalizedCode: "FAILURE_RUNTIME_LEASE_EXPIRATION",
    description: "Lease ownership expired before the runtime could complete safely.",
    defaultSeverity: FAILURE_SEVERITY.MODERATE,
    recoverable: true,
    requiresApproval: false,
    requiresEscalation: false,
    expectedEvidence: ["lease:expired", "lock:stale"],
  },
  "heartbeat loss": {
    category: "heartbeat loss",
    normalizedCode: "FAILURE_RUNTIME_HEARTBEAT_LOSS",
    description: "Expected runtime heartbeats stopped arriving.",
    defaultSeverity: FAILURE_SEVERITY.MODERATE,
    recoverable: true,
    requiresApproval: false,
    requiresEscalation: false,
    expectedEvidence: ["heartbeat:missing"],
  },
  "database unavailable": {
    category: "database unavailable",
    normalizedCode: "FAILURE_INFRASTRUCTURE_DATABASE_UNAVAILABLE",
    description: "Database or primary persistence is unavailable.",
    defaultSeverity: FAILURE_SEVERITY.HIGH,
    recoverable: false,
    requiresApproval: true,
    requiresEscalation: true,
    expectedEvidence: ["database:unavailable"],
  },
  "network instability": {
    category: "network instability",
    normalizedCode: "FAILURE_INFRASTRUCTURE_NETWORK_INSTABILITY",
    description: "External connectivity is unstable.",
    defaultSeverity: FAILURE_SEVERITY.MODERATE,
    recoverable: true,
    requiresApproval: false,
    requiresEscalation: false,
    expectedEvidence: ["network:unstable"],
  },
  "disk exhaustion": {
    category: "disk exhaustion",
    normalizedCode: "FAILURE_INFRASTRUCTURE_DISK_EXHAUSTION",
    description: "Local or attached storage is exhausted.",
    defaultSeverity: FAILURE_SEVERITY.HIGH,
    recoverable: false,
    requiresApproval: true,
    requiresEscalation: true,
    expectedEvidence: ["disk:full"],
  },
  "service degradation": {
    category: "service degradation",
    normalizedCode: "FAILURE_INFRASTRUCTURE_SERVICE_DEGRADATION",
    description: "A dependent subsystem is degraded.",
    defaultSeverity: FAILURE_SEVERITY.MODERATE,
    recoverable: false,
    requiresApproval: true,
    requiresEscalation: false,
    expectedEvidence: ["service:degraded"],
  },
  "dependency unavailable": {
    category: "dependency unavailable",
    normalizedCode: "FAILURE_INFRASTRUCTURE_DEPENDENCY_UNAVAILABLE",
    description: "A required dependency could not be reached or initialized.",
    defaultSeverity: FAILURE_SEVERITY.HIGH,
    recoverable: false,
    requiresApproval: true,
    requiresEscalation: true,
    expectedEvidence: ["dependency:unavailable"],
  },
  "invalid state transition": {
    category: "invalid state transition",
    normalizedCode: "FAILURE_EXECUTION_INVALID_STATE_TRANSITION",
    description: "Execution moved into an illegal lifecycle state.",
    defaultSeverity: FAILURE_SEVERITY.HIGH,
    recoverable: false,
    requiresApproval: true,
    requiresEscalation: true,
    expectedEvidence: ["execution:invalid_transition"],
  },
  "governance denial": {
    category: "governance denial",
    normalizedCode: "FAILURE_EXECUTION_GOVERNANCE_DENIAL",
    description: "Governance or policy denied the requested action.",
    defaultSeverity: FAILURE_SEVERITY.HIGH,
    recoverable: false,
    requiresApproval: false,
    requiresEscalation: true,
    expectedEvidence: ["policy:denied", "governance:decision=deny"],
  },
  "verification mismatch": {
    category: "verification mismatch",
    normalizedCode: "FAILURE_EXECUTION_VERIFICATION_MISMATCH",
    description: "Verification found that the resulting state does not match the expected state.",
    defaultSeverity: FAILURE_SEVERITY.CRITICAL,
    recoverable: false,
    requiresApproval: true,
    requiresEscalation: true,
    expectedEvidence: ["verification:failed"],
  },
  "policy conflict": {
    category: "policy conflict",
    normalizedCode: "FAILURE_EXECUTION_POLICY_CONFLICT",
    description: "Policy outputs disagree or conflict with recovery intent.",
    defaultSeverity: FAILURE_SEVERITY.HIGH,
    recoverable: false,
    requiresApproval: true,
    requiresEscalation: true,
    expectedEvidence: ["policy:conflict"],
  },
  "evidence inconsistency": {
    category: "evidence inconsistency",
    normalizedCode: "FAILURE_EXECUTION_EVIDENCE_INCONSISTENCY",
    description: "Immutable evidence sources do not agree about the execution truth.",
    defaultSeverity: FAILURE_SEVERITY.CATASTROPHIC,
    recoverable: false,
    requiresApproval: true,
    requiresEscalation: true,
    expectedEvidence: ["timeline:disputed", "evidence:immutable_conflict"],
  },
  "operator interruption": {
    category: "operator interruption",
    normalizedCode: "FAILURE_OPERATIONAL_OPERATOR_INTERRUPTION",
    description: "An operator intentionally interrupted execution or recovery.",
    defaultSeverity: FAILURE_SEVERITY.MODERATE,
    recoverable: true,
    requiresApproval: true,
    requiresEscalation: false,
    expectedEvidence: ["operator:interrupted"],
  },
  "conflicting action": {
    category: "conflicting action",
    normalizedCode: "FAILURE_OPERATIONAL_CONFLICTING_ACTION",
    description: "Conflicting recovery or operator actions were detected.",
    defaultSeverity: FAILURE_SEVERITY.CRITICAL,
    recoverable: false,
    requiresApproval: true,
    requiresEscalation: true,
    expectedEvidence: ["recovery:conflicting_action"],
  },
  "approval expiration": {
    category: "approval expiration",
    normalizedCode: "FAILURE_OPERATIONAL_APPROVAL_EXPIRATION",
    description: "Required approval expired before recovery could proceed.",
    defaultSeverity: FAILURE_SEVERITY.HIGH,
    recoverable: true,
    requiresApproval: true,
    requiresEscalation: false,
    expectedEvidence: ["approval:expired"],
  },
  "stale execution": {
    category: "stale execution",
    normalizedCode: "FAILURE_OPERATIONAL_STALE_EXECUTION",
    description: "Execution became stale and no longer trustworthy without intervention.",
    defaultSeverity: FAILURE_SEVERITY.MODERATE,
    recoverable: true,
    requiresApproval: true,
    requiresEscalation: false,
    expectedEvidence: ["execution:stale"],
  },
  "replay divergence": {
    category: "replay divergence",
    normalizedCode: "FAILURE_OPERATIONAL_REPLAY_DIVERGENCE",
    description: "Replay output diverged from the immutable record.",
    defaultSeverity: FAILURE_SEVERITY.CRITICAL,
    recoverable: false,
    requiresApproval: true,
    requiresEscalation: true,
    expectedEvidence: ["replay:divergent"],
  },
};

const CATEGORY_LOOKUP = new Map<string, FailureCategory>(
  Object.keys(FAILURE_CATEGORIES).map((key) => [key.toLowerCase(), key as FailureCategory]),
);

export function getFailureCategoryDefinition(category: FailureCategory) {
  return FAILURE_CATEGORIES[category];
}

export function resolveFailureCategory(value: string): FailureCategory | null {
  return CATEGORY_LOOKUP.get(String(value || "").trim().toLowerCase()) || null;
}
