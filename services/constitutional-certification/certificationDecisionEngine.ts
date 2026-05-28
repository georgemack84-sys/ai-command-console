import type {
  ConstitutionalCertificationDecision,
  ConstitutionalCertificationError,
} from "./certificationStateTypes";

export function decideCertification(input: {
  aggregateScore: number;
  containmentDominatesAutonomy: boolean;
  errors: readonly ConstitutionalCertificationError[];
}): ConstitutionalCertificationDecision {
  if (input.errors.some((error) =>
    error.code === "CONSTITUTIONAL_CERTIFICATION_GOVERNANCE_AMBIGUITY"
    || error.code === "CONSTITUTIONAL_CERTIFICATION_GOVERNANCE_BYPASS"
    || error.code === "CONSTITUTIONAL_CERTIFICATION_STALE_GOVERNANCE")) {
    return "GOVERNANCE_FAILURE";
  }
  if (input.errors.some((error) =>
    error.code === "CONSTITUTIONAL_CERTIFICATION_REPLAY_MISMATCH"
    || error.code === "CONSTITUTIONAL_CERTIFICATION_REPLAY_NONDETERMINISM")) {
    return "REPLAY_FAILURE";
  }
  if (input.errors.some((error) =>
    error.code === "CONSTITUTIONAL_CERTIFICATION_HIDDEN_EXECUTION"
    || error.code === "CONSTITUTIONAL_CERTIFICATION_RECURSIVE_COORDINATION")) {
    return "EMERGENCE_RISK";
  }
  if (!input.containmentDominatesAutonomy || input.errors.some((error) =>
    error.code === "CONSTITUTIONAL_CERTIFICATION_CONTAINMENT_WEAKENING"
    || error.code === "CONSTITUTIONAL_CERTIFICATION_CONTAINMENT_INSUFFICIENT")) {
    return "CONTAINMENT_FAILURE";
  }
  if (input.errors.some((error) =>
    error.code === "CONSTITUTIONAL_CERTIFICATION_ESCALATION_INSTABILITY")) {
    return "ESCALATION_FAILURE";
  }
  if (input.errors.some((error) =>
    error.code === "CONSTITUTIONAL_CERTIFICATION_AUTHORITY_DRIFT")) {
    return "AUTHORITY_BOUNDARY_FAILURE";
  }
  if (input.errors.length > 0) {
    return "REJECTED";
  }
  if (input.aggregateScore >= 0.92) {
    return "CERTIFIED";
  }
  return "CONDITIONALLY_CERTIFIED";
}
