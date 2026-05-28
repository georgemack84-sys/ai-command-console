import type { ContainmentError, CoordinationContainmentAuthorityContract } from "@/types/coordination-containment";

const FORBIDDEN_MARKERS = [
  "workflow",
  "dispatch",
  "schedule",
  "retry",
  "execute",
  "runtime",
  "authorityinheritance",
  "approvalinheritance",
];

export function createContainmentError(
  code: ContainmentError["code"],
  message: string,
  path?: string,
): ContainmentError {
  return Object.freeze({ code, message, path });
}

export function buildContainmentAuthorityContract(): CoordinationContainmentAuthorityContract {
  return Object.freeze({
    executionAuthority: false,
    orchestrationAuthority: false,
    schedulingAuthority: false,
    governanceMutationAuthority: false,
    runtimeMutationAuthority: false,
    approvalInheritance: false,
    authorityInheritance: false,
    autonomousIntervention: false,
  });
}

export function enforceOrchestrationBoundary(input: {
  authorityContract: CoordinationContainmentAuthorityContract;
  metadata?: Readonly<Record<string, unknown>>;
}): readonly ContainmentError[] {
  const errors: ContainmentError[] = [];
  for (const [key, value] of Object.entries(input.authorityContract)) {
    if (value !== false) {
      errors.push(createContainmentError(
        "CONTAINMENT_AUTHORITY_EXPANSION_DETECTED",
        "Containment authority cannot expand beyond false-only constitutional bounds.",
        `authorityContract.${key}`,
      ));
    }
  }
  const serialized = JSON.stringify(input.metadata ?? {}).toLowerCase();
  for (const marker of FORBIDDEN_MARKERS) {
    if (serialized.includes(marker)) {
      errors.push(createContainmentError(
        marker === "retry"
          ? "CONTAINMENT_SILENT_RETRY_DETECTED"
          : marker === "schedule"
            ? "CONTAINMENT_HIDDEN_ORCHESTRATION_DETECTED"
            : marker === "workflow"
              ? "CONTAINMENT_WORKFLOW_SYNTHESIS_DETECTED"
              : "CONTAINMENT_HIDDEN_ORCHESTRATION_DETECTED",
        "Containment metadata exposed a forbidden orchestration-adjacent marker.",
        `metadata.${marker}`,
      ));
    }
  }
  return Object.freeze(errors);
}
