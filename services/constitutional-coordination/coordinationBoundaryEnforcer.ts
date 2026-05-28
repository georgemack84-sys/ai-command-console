import type {
  ConstitutionalCoordinationAuthorityContract,
  ConstitutionalCoordinationError,
} from "@/types/constitutional-coordination";

const FORBIDDEN_MARKERS = [
  "execute",
  "dispatch",
  "schedule",
  "retry",
  "workflow",
  "orchestrat",
  "mutateruntime",
  "authorityinheritance",
  "approvalinheritance",
];

export function createConstitutionalCoordinationError(
  code: ConstitutionalCoordinationError["code"],
  message: string,
  path?: string,
): ConstitutionalCoordinationError {
  return Object.freeze({ code, message, path });
}

export function buildConstitutionalCoordinationAuthorityContract(): ConstitutionalCoordinationAuthorityContract {
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

export function enforceConstitutionalCoordinationBoundary(input: {
  authorityContract: ConstitutionalCoordinationAuthorityContract;
  metadata?: Readonly<Record<string, unknown>>;
}): readonly ConstitutionalCoordinationError[] {
  const errors: ConstitutionalCoordinationError[] = [];
  for (const [key, value] of Object.entries(input.authorityContract)) {
    if (value !== false) {
      errors.push(createConstitutionalCoordinationError(
        "CONSTITUTIONAL_COORDINATION_AUTHORITY_EXPANSION",
        "Constitutional coordination authority must remain false-only.",
        `authorityContract.${key}`,
      ));
    }
  }

  const serialized = JSON.stringify(input.metadata ?? {}).toLowerCase();
  for (const marker of FORBIDDEN_MARKERS) {
    if (serialized.includes(marker)) {
      errors.push(createConstitutionalCoordinationError(
        marker.includes("runtime")
          ? "CONSTITUTIONAL_COORDINATION_RUNTIME_MUTATION"
          : marker.includes("inheritance")
            ? "CONSTITUTIONAL_COORDINATION_AUTHORITY_EXPANSION"
            : "CONSTITUTIONAL_COORDINATION_HIDDEN_ORCHESTRATION",
        "Forbidden orchestration-adjacent coordination metadata was detected.",
        `metadata.${marker}`,
      ));
    }
  }

  return Object.freeze(errors);
}
