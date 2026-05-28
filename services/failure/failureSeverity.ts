export const FAILURE_SEVERITY = {
  LOW: "LOW",
  MODERATE: "MODERATE",
  HIGH: "HIGH",
  CRITICAL: "CRITICAL",
  CATASTROPHIC: "CATASTROPHIC",
} as const;

export type FailureSeverity = (typeof FAILURE_SEVERITY)[keyof typeof FAILURE_SEVERITY];

const SEVERITY_RANK: Record<FailureSeverity, number> = {
  LOW: 1,
  MODERATE: 2,
  HIGH: 3,
  CRITICAL: 4,
  CATASTROPHIC: 5,
};

export function compareFailureSeverity(left: FailureSeverity, right: FailureSeverity) {
  return SEVERITY_RANK[left] - SEVERITY_RANK[right];
}

export function maxFailureSeverity(...values: Array<FailureSeverity | null | undefined>) {
  return values.filter(Boolean).sort((left, right) => compareFailureSeverity(right!, left!))[0] || FAILURE_SEVERITY.LOW;
}

export function isAutomaticRecoveryBlockedForSeverity(severity: FailureSeverity) {
  return severity === FAILURE_SEVERITY.CATASTROPHIC;
}

export function deriveFailureSeverity({
  defaultSeverity,
  evidence = [],
  contradictory = false,
  severityHint,
}: {
  defaultSeverity: FailureSeverity;
  evidence?: string[];
  contradictory?: boolean;
  severityHint?: FailureSeverity | null;
}): FailureSeverity {
  let severity = maxFailureSeverity(defaultSeverity, severityHint || undefined);
  const normalizedEvidence = evidence.map((entry) => String(entry || "").trim().toLowerCase());

  if (contradictory) {
    severity = maxFailureSeverity(severity, FAILURE_SEVERITY.CRITICAL);
  }

  if (normalizedEvidence.some((entry) => entry.includes("immutable_conflict") || entry.includes("tenant_scope_violation"))) {
    severity = FAILURE_SEVERITY.CATASTROPHIC;
  } else if (normalizedEvidence.some((entry) => entry.includes("replay:divergent") || entry.includes("timeline:disputed") || entry.includes("verification:failed"))) {
    severity = maxFailureSeverity(severity, FAILURE_SEVERITY.CRITICAL);
  } else if (normalizedEvidence.some((entry) => entry.includes("database:unavailable") || entry.includes("policy:denied") || entry.includes("approval:expired"))) {
    severity = maxFailureSeverity(severity, FAILURE_SEVERITY.HIGH);
  }

  return severity;
}
