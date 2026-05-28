import type {
  EscalationAwareCoordinationAuthorityContract,
  EscalationAwareCoordinationError,
} from "@/types/escalation-aware-coordination";

const FORBIDDEN_MARKERS = [
  "execute",
  "dispatch",
  "schedule",
  "retry",
  "selfresolve",
  "mutateruntime",
  "authorityinheritance",
  "approvalinheritance",
  "continuation",
  "continueworkflow",
  "topologysynthesis",
];

function error(
  code: EscalationAwareCoordinationError["code"],
  message: string,
  path?: string,
): EscalationAwareCoordinationError {
  return Object.freeze({ code, message, path });
}

export function buildEscalationAwareAuthorityContract(): EscalationAwareCoordinationAuthorityContract {
  return Object.freeze({
    executionAuthority: false,
    orchestrationAuthority: false,
    schedulingAuthority: false,
    governanceMutationAuthority: false,
    runtimeMutationAuthority: false,
    approvalInheritance: false,
    authorityInheritance: false,
    autonomousIntervention: false,
    workflowContinuation: false,
  });
}

export function validateEscalationBoundary(input: {
  authorityContract: EscalationAwareCoordinationAuthorityContract;
  metadata?: Readonly<Record<string, unknown>>;
}): readonly EscalationAwareCoordinationError[] {
  const errors: EscalationAwareCoordinationError[] = [];
  for (const [key, value] of Object.entries(input.authorityContract)) {
    if (value !== false) {
      errors.push(error(
        key.includes("runtime")
          ? "ESCALATION_COORDINATION_RUNTIME_MUTATION_FORBIDDEN"
          : key.includes("inheritance")
            ? "ESCALATION_COORDINATION_AUTHORITY_INHERITANCE_FORBIDDEN"
            : key.includes("execution")
              ? "ESCALATION_COORDINATION_EXECUTION_FORBIDDEN"
              : "ESCALATION_COORDINATION_ORCHESTRATION_FORBIDDEN",
        "Escalation-aware coordination authority must remain false-only.",
        `authorityContract.${key}`,
      ));
    }
  }
  const serialized = JSON.stringify(input.metadata ?? {}).toLowerCase();
  for (const marker of FORBIDDEN_MARKERS) {
    if (serialized.includes(marker)) {
      errors.push(error(
        marker.includes("mutateruntime")
          ? "ESCALATION_COORDINATION_RUNTIME_MUTATION_FORBIDDEN"
          : marker.includes("inheritance")
            ? "ESCALATION_COORDINATION_AUTHORITY_INHERITANCE_FORBIDDEN"
            : marker.includes("execute")
              ? "ESCALATION_COORDINATION_EXECUTION_FORBIDDEN"
              : "ESCALATION_COORDINATION_ORCHESTRATION_FORBIDDEN",
        "Forbidden escalation coordination marker was detected.",
        `metadata.${marker}`,
      ));
    }
  }
  return Object.freeze(errors);
}
