import type { OperationalRule } from "./types";

export const DEFAULT_OPERATIONAL_RULES = Object.freeze([
  Object.freeze({
    id: "UNKNOWN_UNSAFE",
    version: "1.0",
    description: "Unknown operational state is unsafe and must be contained as disputed.",
    enforcementPoint: [
      "Preflight",
      "Planner",
      "Governance",
      "Execution",
      "Recovery",
      "Deployment",
      "Retry Logic",
      "Replay",
      "Monitoring",
      "Certification",
    ] as const,
    severity: "CRITICAL",
    enabled: true,
  }),
  Object.freeze({
    id: "DISPUTED_NON_DEPLOYABLE",
    version: "1.0",
    description: "Disputed operational state cannot deploy or recover without explicit containment.",
    enforcementPoint: ["Governance", "Recovery", "Deployment", "Certification"] as const,
    severity: "CRITICAL",
    enabled: true,
  }),
  Object.freeze({
    id: "RETRY_REQUIRES_CLASSIFICATION",
    version: "1.0",
    description: "Retries require a known failure classification and cannot proceed from unknown failure.",
    enforcementPoint: ["Retry Logic", "Recovery", "Execution"] as const,
    severity: "CRITICAL",
    enabled: true,
  }),
  Object.freeze({
    id: "RELEASE_GATE_REQUIRED",
    version: "1.0",
    description: "Deployment cannot bypass the certified release gate.",
    enforcementPoint: ["Deployment", "Certification"] as const,
    severity: "CRITICAL",
    enabled: true,
  }),
  Object.freeze({
    id: "NO_HIDDEN_STATE_MUTATION",
    version: "1.0",
    description: "State mutation requires visible before/after evidence, actor, reason, timestamp, and hash.",
    enforcementPoint: ["Execution", "Recovery", "Deployment", "Monitoring"] as const,
    severity: "CRITICAL",
    enabled: true,
  }),
  Object.freeze({
    id: "REPLAY_REMAINS_AUTHORITATIVE",
    version: "1.0",
    description: "Runtime state cannot override replay; runtime and replay conflict becomes disputed.",
    enforcementPoint: ["Replay", "Recovery", "Deployment", "Certification"] as const,
    severity: "CRITICAL",
    enabled: true,
  }),
] as const) satisfies readonly OperationalRule[];

export function getEnabledOperationalRules() {
  return DEFAULT_OPERATIONAL_RULES.filter((rule) => rule.enabled);
}
