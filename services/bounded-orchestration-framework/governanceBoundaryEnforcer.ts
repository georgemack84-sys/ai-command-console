import type {
  BoundedOrchestrationAuthorityContract,
  BoundedOrchestrationError,
  BoundedOrchestrationInput,
} from "@/types/bounded-orchestration-framework";

const FORBIDDEN_MARKERS = [
  "execute",
  "dispatch",
  "schedule",
  "retry",
  "workflow",
  "generated_workflow",
  "orchestrat",
  "mutateruntime",
  "authorityinheritance",
  "approvalinheritance",
  "repairreplay",
  "dynamicorchestration",
];

export function buildBoundedOrchestrationAuthorityContract(): BoundedOrchestrationAuthorityContract {
  return Object.freeze({
    executionAuthority: false,
    orchestrationAuthority: false,
    dispatchAuthority: false,
    schedulingAuthority: false,
    runtimeMutationAuthority: false,
    governanceMutationAuthority: false,
    approvalInheritance: false,
    authorityInheritance: false,
    autonomousIntervention: false,
    workflowContinuation: false,
  });
}

export function enforceBoundedOrchestrationBoundary(input: {
  authorityContract: BoundedOrchestrationAuthorityContract;
  metadata?: Readonly<Record<string, unknown>>;
}): readonly BoundedOrchestrationError[] {
  const errors: BoundedOrchestrationError[] = [];
  for (const [key, value] of Object.entries(input.authorityContract)) {
    if (value !== false) {
      errors.push(Object.freeze({
        code: "ORCHESTRATION_BOUNDARY_AUTHORITY_EXPANSION",
        message: "Bounded orchestration authority must remain permanently false-only.",
        path: `authorityContract.${key}`,
      }));
    }
  }
  const serialized = JSON.stringify(input.metadata ?? {}).toLowerCase();
  for (const marker of FORBIDDEN_MARKERS) {
    if (serialized.includes(marker)) {
      errors.push(Object.freeze({
        code: marker.includes("runtime")
          ? "ORCHESTRATION_BOUNDARY_RUNTIME_MUTATION"
          : marker.includes("dynamic")
            ? "ORCHESTRATION_BOUNDARY_DYNAMIC_GENERATION"
            : marker.includes("repairreplay")
              ? "ORCHESTRATION_BOUNDARY_REPLAY_AMBIGUITY"
              : marker.includes("inheritance")
                ? "ORCHESTRATION_AUTHORITY_EXPANSION"
                : "ORCHESTRATION_BOUNDARY_HIDDEN_ORCHESTRATION",
        message: "Forbidden orchestration-adjacent metadata was detected.",
        path: `metadata.${marker}`,
      }));
    }
  }
  return Object.freeze(errors);
}

export function enforceGovernanceBoundary(input: BoundedOrchestrationInput): readonly BoundedOrchestrationError[] {
  const errors: BoundedOrchestrationError[] = [];
  if (input.coordinationRecord.governanceSnapshotId !== input.routingResult.governanceSnapshotId) {
    errors.push(Object.freeze({
      code: "ORCHESTRATION_BOUNDARY_GOVERNANCE_MISMATCH",
      message: "Governance snapshot mismatch prevents bounded orchestration validation.",
      path: "governanceSnapshotId",
    }));
  }

  const serialized = JSON.stringify(input.metadata ?? {}).toLowerCase();
  if (serialized.includes("bypassgovernance") || serialized.includes("mutategovernance")) {
    errors.push(Object.freeze({
      code: "ORCHESTRATION_BOUNDARY_GOVERNANCE_MISMATCH",
      message: "Governance boundary bypass markers were detected.",
      path: "metadata.governance",
    }));
  }

  return Object.freeze(errors);
}
