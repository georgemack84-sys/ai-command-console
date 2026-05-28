import type {
  ConstitutionalReadinessCertification,
  ConstitutionalReadinessLevel,
  ReadinessValidation,
} from "@/types/constitutional-autonomy-readiness-gate";
import { hashReadinessValue } from "./readinessHasher";

const LEVELS: readonly ConstitutionalReadinessLevel[] = [
  "CR0_UNVERIFIED",
  "CR1_REPLAY_VALID",
  "CR2_GOVERNANCE_VALID",
  "CR3_APPROVAL_VALID",
  "CR4_OVERRIDE_VALID",
  "CR5_ESCALATION_VALID",
  "CR6_CONTAINMENT_VALID",
  "CR7_CONSTITUTIONALLY_READY",
];

export function buildReadinessCertification(input: {
  validation: ReadinessValidation;
  createdAt: string;
}): ConstitutionalReadinessCertification {
  const score = Math.round((LEVELS.indexOf(input.validation.readinessLevel) / (LEVELS.length - 1)) * 100);
  return Object.freeze({
    certificationId: hashReadinessValue("readiness-certification-id", {
      readinessLevel: input.validation.readinessLevel,
      createdAt: input.createdAt,
    }),
    readinessLevel: input.validation.readinessLevel,
    certified: input.validation.readinessLevel === "CR7_CONSTITUTIONALLY_READY",
    score,
    rationale: input.validation.reasons,
    dashboardViews: Object.freeze({
      observationView: Object.freeze(["monitoring", "confidence", "runtime-boundary"]),
      recommendationView: Object.freeze(["escalation", "proposal", "safe-action"]),
      approvalView: Object.freeze(["approval-graph", "dependency-topology"]),
      escalationView: Object.freeze(["constitutional-escalation", "freeze-recommendation"]),
      replayView: Object.freeze(["replay-binding", "lineage", "determinism"]),
      overrideView: Object.freeze(["override-lineage", "freeze-state", "kill-switch"]),
      governanceView: Object.freeze(["governance-policy", "authority-boundaries", "violations"]),
      confidenceView: Object.freeze(["confidence-lineage", "caution-state", "uncertainty"]),
    }),
    derivedOnly: true,
    createdAt: input.createdAt,
  });
}
