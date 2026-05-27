import type { HumanSupremacyAuthorityContract, HumanSupremacyError } from "@/types/human-supremacy";

export function createHumanSupremacyError(
  code: import("@/types/human-supremacy").HumanSupremacyErrorCode,
  message: string,
  path: string,
): HumanSupremacyError {
  return Object.freeze({ code, message, path });
}

export function buildHumanSupremacyAuthorityContract(): HumanSupremacyAuthorityContract {
  return Object.freeze({
    executionAuthority: false,
    orchestrationAuthority: false,
    schedulingAuthority: false,
    governanceMutationAuthority: false,
    approvalInheritance: false,
    authorityInheritance: false,
    autonomousIntervention: false,
    selfResumeAuthority: false,
    selfRecoveryAuthority: false,
    runtimeMutationAuthority: false,
  });
}

const forbiddenMetadataKeys = new Map<string, import("@/types/human-supremacy").HumanSupremacyErrorCode>([
  ["autonomousOverride", "HUMAN_SUPREMACY_AUTONOMOUS_OVERRIDE_FORBIDDEN"],
  ["automaticFreeze", "HUMAN_SUPREMACY_AUTONOMOUS_FREEZE_FORBIDDEN"],
  ["selfResume", "HUMAN_SUPREMACY_SELF_RESUME_FORBIDDEN"],
  ["governanceBypass", "HUMAN_SUPREMACY_GOVERNANCE_BYPASS_FORBIDDEN"],
  ["authorityInheritance", "HUMAN_SUPREMACY_AUTHORITY_INHERITANCE_FORBIDDEN"],
  ["executionAuthority", "HUMAN_SUPREMACY_EXECUTION_LEAK_FORBIDDEN"],
  ["orchestrationPlan", "HUMAN_SUPREMACY_ORCHESTRATION_LEAK_FORBIDDEN"],
]);

export function validateAuthorityBoundary(input: {
  authorityContract: HumanSupremacyAuthorityContract;
  metadata?: Readonly<Record<string, unknown>>;
}): readonly HumanSupremacyError[] {
  const errors: HumanSupremacyError[] = [];
  if (Object.values(input.authorityContract).some(Boolean)) {
    errors.push(createHumanSupremacyError(
      "HUMAN_SUPREMACY_AUTHORITY_CONFLICT",
      "Human supremacy authority contract must remain false-only.",
      "authorityContract",
    ));
  }
  for (const [key, code] of forbiddenMetadataKeys) {
    if (input.metadata?.[key] === true) {
      errors.push(createHumanSupremacyError(code, `Forbidden intervention metadata "${key}" detected.`, `metadata.${key}`));
    }
  }
  return Object.freeze(errors);
}
