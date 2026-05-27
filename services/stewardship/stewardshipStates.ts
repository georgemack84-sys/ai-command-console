export const STEWARDSHIP_STATES = [
  "MONITORING",
  "SUPERVISING",
  "STABILIZING",
  "DEGRADED",
  "ESCALATED",
  "CONTAINED",
  "FROZEN",
  "DISPUTED",
  "VERIFIED",
] as const;

export type StewardshipState = (typeof STEWARDSHIP_STATES)[number];

export type StewardshipStateMetadata = {
  terminal: boolean;
  severity: "low" | "moderate" | "high" | "critical";
};

export const STEWARDSHIP_STATE_METADATA: Record<StewardshipState, StewardshipStateMetadata> = {
  MONITORING: { terminal: false, severity: "low" },
  SUPERVISING: { terminal: false, severity: "moderate" },
  STABILIZING: { terminal: false, severity: "moderate" },
  DEGRADED: { terminal: false, severity: "high" },
  ESCALATED: { terminal: true, severity: "critical" },
  CONTAINED: { terminal: true, severity: "critical" },
  FROZEN: { terminal: true, severity: "critical" },
  DISPUTED: { terminal: true, severity: "critical" },
  VERIFIED: { terminal: true, severity: "low" },
};

const ALLOWED_TRANSITIONS: Record<StewardshipState, StewardshipState[]> = {
  MONITORING: ["SUPERVISING", "STABILIZING", "DEGRADED", "ESCALATED", "CONTAINED", "FROZEN", "DISPUTED", "VERIFIED"],
  SUPERVISING: ["STABILIZING", "DEGRADED", "ESCALATED", "CONTAINED", "FROZEN", "DISPUTED", "VERIFIED"],
  STABILIZING: ["DEGRADED", "ESCALATED", "CONTAINED", "FROZEN", "DISPUTED", "VERIFIED"],
  DEGRADED: ["STABILIZING", "ESCALATED", "CONTAINED", "FROZEN", "DISPUTED", "VERIFIED"],
  ESCALATED: ["CONTAINED", "FROZEN", "DISPUTED", "VERIFIED"],
  CONTAINED: ["ESCALATED", "DISPUTED", "VERIFIED"],
  FROZEN: ["ESCALATED", "DISPUTED", "VERIFIED"],
  DISPUTED: ["ESCALATED", "CONTAINED", "FROZEN", "VERIFIED"],
  VERIFIED: ["MONITORING", "SUPERVISING", "STABILIZING", "DEGRADED", "ESCALATED", "CONTAINED", "FROZEN", "DISPUTED"],
};

export function isTerminalStewardshipState(state: StewardshipState) {
  return STEWARDSHIP_STATE_METADATA[state].terminal;
}

export function canTransitionStewardshipState(from: StewardshipState | undefined, to: StewardshipState) {
  if (!from) {
    return true;
  }
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function validateStewardshipTransition(from: StewardshipState | undefined, to: StewardshipState) {
  return {
    ok: canTransitionStewardshipState(from, to),
    code: canTransitionStewardshipState(from, to) ? null : "STEWARDSHIP_INVALID_TRANSITION",
  };
}
