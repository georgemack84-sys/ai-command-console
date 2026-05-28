import type {
  HumanCoordinationOverrideAuthorityContract,
  HumanCoordinationOverrideError,
} from "@/types/human-coordination-override";

function error(
  code: HumanCoordinationOverrideError["code"],
  message: string,
  path?: string,
): HumanCoordinationOverrideError {
  return Object.freeze({ code, message, path });
}

const FORBIDDEN_MARKERS: ReadonlyArray<{
  marker: string;
  code: HumanCoordinationOverrideError["code"];
  message: string;
}> = Object.freeze([
  { marker: "execute", code: "HUMAN_COORDINATION_OVERRIDE_EXECUTION_FORBIDDEN", message: "Human override may not introduce execution semantics." },
  { marker: "dispatch", code: "HUMAN_COORDINATION_OVERRIDE_EXECUTION_FORBIDDEN", message: "Human override may not dispatch runtime work." },
  { marker: "schedule", code: "HUMAN_COORDINATION_OVERRIDE_ORCHESTRATION_FORBIDDEN", message: "Human override may not introduce scheduling semantics." },
  { marker: "continueworkflow", code: "HUMAN_COORDINATION_OVERRIDE_HIDDEN_CONTINUATION", message: "Hidden workflow continuation markers are forbidden." },
  { marker: "resume", code: "HUMAN_COORDINATION_OVERRIDE_HIDDEN_CONTINUATION", message: "Human override may interrupt but not resume coordination." },
  { marker: "restart", code: "HUMAN_COORDINATION_OVERRIDE_ROUTING_RESTORATION", message: "Override cannot restart or restore routing continuity." },
  { marker: "mutateruntime", code: "HUMAN_COORDINATION_OVERRIDE_RUNTIME_MUTATION", message: "Runtime mutation markers are forbidden." },
  { marker: "reinterpretgovernance", code: "HUMAN_COORDINATION_OVERRIDE_GOVERNANCE_MUTATION", message: "Governance reinterpretation is forbidden." },
  { marker: "repairreplay", code: "HUMAN_COORDINATION_OVERRIDE_REPLAY_REPAIR", message: "Replay repair is forbidden." },
  { marker: "synthesizetopology", code: "HUMAN_COORDINATION_OVERRIDE_TOPOLOGY_SYNTHESIS", message: "Topology synthesis is forbidden." },
  { marker: "authorityinheritance", code: "HUMAN_COORDINATION_OVERRIDE_AUTHORITY_INHERITANCE", message: "Authority inheritance is forbidden." },
  { marker: "approvalinheritance", code: "HUMAN_COORDINATION_OVERRIDE_AUTHORITY_INHERITANCE", message: "Approval inheritance is forbidden." },
  { marker: "suppressescalation", code: "HUMAN_COORDINATION_OVERRIDE_ESCALATION_SUPPRESSION", message: "Escalation suppression is forbidden." },
]);

export function buildHumanCoordinationOverrideAuthorityContract(): HumanCoordinationOverrideAuthorityContract {
  return Object.freeze({
    executionAuthority: false,
    orchestrationAuthority: false,
    schedulingAuthority: false,
    runtimeMutationAuthority: false,
    governanceMutationAuthority: false,
    approvalInheritance: false,
    authorityInheritance: false,
    autonomousIntervention: false,
    workflowContinuation: false,
  });
}

export function validateOverrideBoundary(input: {
  authorityContract: HumanCoordinationOverrideAuthorityContract;
  metadata?: Readonly<Record<string, unknown>>;
}): readonly HumanCoordinationOverrideError[] {
  const errors: HumanCoordinationOverrideError[] = [];
  const serialized = JSON.stringify(input.metadata ?? {}).toLowerCase();
  for (const marker of FORBIDDEN_MARKERS) {
    if (serialized.includes(marker.marker)) {
      errors.push(error(marker.code, marker.message, `metadata.${marker.marker}`));
    }
  }
  return Object.freeze(errors);
}
