import type {
  AntiEmergenceValidationInput,
  AntiEmergenceValidationResult,
  ContainmentViolation,
} from "@/types/coordination-containment";
import { hashContainmentValue } from "./containmentHasher";
import { resolveContainmentState } from "./containmentFreezeManager";

function buildViolation(input: {
  category: ContainmentViolation["category"];
  severity: ContainmentViolation["severity"];
  reason: string;
  evidence: readonly string[];
}): ContainmentViolation {
  return Object.freeze({
    violationId: hashContainmentValue("containment-violation", input),
    category: input.category,
    severity: input.severity,
    replaySafe: true,
    deterministic: true,
    containmentRequired: true,
    reason: input.reason,
    evidence: Object.freeze([...input.evidence].sort()),
  });
}

export function validateAntiEmergence(input: AntiEmergenceValidationInput): AntiEmergenceValidationResult {
  const violations: ContainmentViolation[] = [];

  if (input.hiddenMarkers.length > 0) {
    violations.push(buildViolation({
      category: input.hiddenMarkers.some((marker) => marker.toLowerCase().includes("retry")) ? "silent_retry" : "hidden_orchestration",
      severity: "critical",
      reason: "Hidden orchestration markers were detected in coordination evidence.",
      evidence: input.hiddenMarkers,
    }));
  }
  if (input.recursiveMarkers.length > 0) {
    violations.push(buildViolation({
      category: "recursive_coordination",
      severity: "high",
      reason: "Recursive coordination growth or bounded-depth overflow was detected.",
      evidence: input.recursiveMarkers,
    }));
  }
  if (input.authorityMarkers.length > 0) {
    violations.push(buildViolation({
      category: "authority_expansion",
      severity: "critical",
      reason: "Authority expansion or inheritance markers were detected.",
      evidence: input.authorityMarkers,
    }));
  }
  if (input.runtimeMarkers.length > 0) {
    violations.push(buildViolation({
      category: "runtime_mutation",
      severity: "critical",
      reason: "Runtime mutation markers were detected.",
      evidence: input.runtimeMarkers,
    }));
  }
  if (input.replayErrors.length > 0) {
    violations.push(buildViolation({
      category: "replay_violation",
      severity: "critical",
      reason: "Replay containment could not verify immutable ancestry.",
      evidence: input.replayErrors,
    }));
  }

  const provisional: AntiEmergenceValidationResult = Object.freeze({
    allowed: violations.length === 0,
    containmentState: violations.length === 0 ? "safe" : "disputed",
    violations: Object.freeze(violations.sort((left, right) => left.violationId.localeCompare(right.violationId))),
    replaySafe: input.replayErrors.length === 0,
    deterministic: true,
    governanceEscalationRequired: violations.length > 0,
    failClosed: violations.length > 0,
  });

  return Object.freeze({
    ...provisional,
    containmentState: resolveContainmentState(provisional),
  });
}
