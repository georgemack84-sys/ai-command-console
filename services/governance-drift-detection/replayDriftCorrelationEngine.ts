import type {
  GovernanceDriftError,
  GovernanceDriftFinding,
  GovernanceDriftInput,
} from "@/types/governance-drift";
import { hashGovernanceDriftValue } from "./deterministicDriftHasher";

export function correlateReplayDrift(input: {
  driftInput: GovernanceDriftInput;
  errors: readonly GovernanceDriftError[];
}): readonly GovernanceDriftFinding[] {
  const findings: GovernanceDriftFinding[] = [];
  for (const error of input.errors) {
    if (error.code.includes("GOVERNANCE")) {
      findings.push(Object.freeze({
        findingId: hashGovernanceDriftValue("governance-finding-id", error),
        driftId: input.driftInput.driftId,
        category: "GOVERNANCE_DRIFT",
        severity: "CONSTITUTIONAL_BLOCKER",
        rationale: error.message,
        advisoryOnly: true,
        deterministicHash: hashGovernanceDriftValue("governance-finding", error),
      }));
      continue;
    }
    if (error.code.includes("REPLAY")) {
      findings.push(Object.freeze({
        findingId: hashGovernanceDriftValue("replay-finding-id", error),
        driftId: input.driftInput.driftId,
        category: "REPLAY_DRIFT",
        severity: "CRITICAL",
        rationale: error.message,
        advisoryOnly: true,
        deterministicHash: hashGovernanceDriftValue("replay-finding", error),
      }));
      continue;
    }
    if (error.code.includes("CONFIDENCE")) {
      findings.push(Object.freeze({
        findingId: hashGovernanceDriftValue("confidence-finding-id", error),
        driftId: input.driftInput.driftId,
        category: "CONFIDENCE_DRIFT",
        severity: "HIGH",
        rationale: error.message,
        advisoryOnly: true,
        deterministicHash: hashGovernanceDriftValue("confidence-finding", error),
      }));
      continue;
    }
    if (error.code.includes("ESCALATION")) {
      findings.push(Object.freeze({
        findingId: hashGovernanceDriftValue("escalation-finding-id", error),
        driftId: input.driftInput.driftId,
        category: "ESCALATION_DRIFT",
        severity: "CRITICAL",
        rationale: error.message,
        advisoryOnly: true,
        deterministicHash: hashGovernanceDriftValue("escalation-finding", error),
      }));
      continue;
    }
    if (error.code.includes("DEPENDENCY") || error.code.includes("TOPOLOGY")) {
      findings.push(Object.freeze({
        findingId: hashGovernanceDriftValue("dependency-finding-id", error),
        driftId: input.driftInput.driftId,
        category: "DEPENDENCY_DRIFT",
        severity: "CRITICAL",
        rationale: error.message,
        advisoryOnly: true,
        deterministicHash: hashGovernanceDriftValue("dependency-finding", error),
      }));
      continue;
    }
    if (error.code.includes("RECOMMENDATION")) {
      findings.push(Object.freeze({
        findingId: hashGovernanceDriftValue("recommendation-finding-id", error),
        driftId: input.driftInput.driftId,
        category: "RECOMMENDATION_DRIFT",
        severity: "HIGH",
        rationale: error.message,
        advisoryOnly: true,
        deterministicHash: hashGovernanceDriftValue("recommendation-finding", error),
      }));
      continue;
    }
    if (error.code.includes("ISOLATION") || error.code.includes("RUNTIME")) {
      findings.push(Object.freeze({
        findingId: hashGovernanceDriftValue("isolation-finding-id", error),
        driftId: input.driftInput.driftId,
        category: "GOVERNANCE_DRIFT",
        severity: "CONSTITUTIONAL_BLOCKER",
        rationale: error.message,
        advisoryOnly: true,
        deterministicHash: hashGovernanceDriftValue("isolation-finding", error),
      }));
    }
  }
  return Object.freeze(findings.sort((left, right) =>
    left.deterministicHash.localeCompare(right.deterministicHash),
  ));
}
