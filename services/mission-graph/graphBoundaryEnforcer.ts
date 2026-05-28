import type { MissionGraphAuthorityContract, MissionGraphError } from "@/types/mission-graph";

export function createMissionGraphError(
  code: import("@/types/mission-graph").MissionGraphErrorCode,
  message: string,
  path: string,
): MissionGraphError {
  return Object.freeze({ code, message, path });
}

export function buildMissionGraphAuthorityContract(): MissionGraphAuthorityContract {
  return Object.freeze({
    mayExecute: false,
    mayAuthorizeExecution: false,
    mayAdvanceLifecycle: false,
    mayRepairReplay: false,
    mayRestoreTrust: false,
    mayResumeCoordination: false,
    mayBypassGovernance: false,
    mayGenerateApproval: false,
    mayModifyPolicy: false,
    mayScheduleOperations: false,
    mayDispatchRuntimeActions: false,
    mayInferAuthority: false,
  });
}

const forbiddenMarkers = [
  "execute",
  "orchestrat",
  "workflow",
  "approvalinheritance",
  "approval_inheritance",
  "authoritychain",
  "authority_chain",
  "repairreplay",
  "repair_replay",
  "schedule",
  "dispatch",
  "resume",
  "retry",
  "mutate",
  "runtime",
];

function detectForbiddenMarkers(value: unknown, path: string, errors: MissionGraphError[]): void {
  if (typeof value === "string") {
    const normalized = value.toLowerCase().replace(/[^a-z_]/g, "");
    for (const marker of forbiddenMarkers) {
      if (normalized.includes(marker)) {
        errors.push(createMissionGraphError(
          marker.includes("schedule")
            ? "MISSION_GRAPH_SCHEDULING_REJECTED"
            : marker.includes("workflow")
              ? "MISSION_GRAPH_WORKFLOW_SYNTHESIS_REJECTED"
              : marker.includes("repair")
                ? "MISSION_GRAPH_REPLAY_REPAIR_REJECTED"
                : marker.includes("authority")
                  ? "MISSION_GRAPH_AUTHORITY_LEAKAGE"
                  : marker.includes("dispatch") || marker.includes("execute")
                    ? "MISSION_GRAPH_EXECUTION_INFERENCE_REJECTED"
                    : marker.includes("orchestrat")
                      ? "MISSION_GRAPH_ORCHESTRATION_REJECTED"
                      : marker.includes("mutate") || marker.includes("runtime")
                        ? "MISSION_GRAPH_RUNTIME_MUTATION_REJECTED"
                        : "MISSION_GRAPH_TOPOLOGY_INCONSISTENCY",
          `Mission graph visibility rejected forbidden marker "${marker}".`,
          path,
        ));
      }
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((entry, index) => detectForbiddenMarkers(entry, `${path}[${index}]`, errors));
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      detectForbiddenMarkers(key, `${path}._key`, errors);
      detectForbiddenMarkers(entry, `${path}.${key}`, errors);
    }
  }
}

export function enforceMissionGraphBoundary(input: {
  authorityContract: MissionGraphAuthorityContract;
  metadata?: Readonly<Record<string, unknown>>;
}): Readonly<{
  errors: readonly MissionGraphError[];
  visibilityFrozen: boolean;
  governanceEscalationEvidence: readonly string[];
}> {
  const errors: MissionGraphError[] = [];
  if (input.authorityContract.mayExecute
    || input.authorityContract.mayAuthorizeExecution
    || input.authorityContract.mayAdvanceLifecycle
    || input.authorityContract.mayRepairReplay
    || input.authorityContract.mayRestoreTrust
    || input.authorityContract.mayResumeCoordination
    || input.authorityContract.mayBypassGovernance
    || input.authorityContract.mayGenerateApproval
    || input.authorityContract.mayModifyPolicy
    || input.authorityContract.mayScheduleOperations
    || input.authorityContract.mayDispatchRuntimeActions
    || input.authorityContract.mayInferAuthority) {
    errors.push(createMissionGraphError(
      "MISSION_GRAPH_AUTHORITY_LEAKAGE",
      "Mission graph authority contract must remain false-only.",
      "authorityContract",
    ));
  }
  detectForbiddenMarkers(input.metadata, "metadata", errors);
  return Object.freeze({
    errors: Object.freeze(errors),
    visibilityFrozen: errors.length > 0,
    governanceEscalationEvidence: Object.freeze(errors.map((error) => `${error.code}:${error.path}`)),
  });
}

export function assertMissionGraphSourcesAreReadOnly(sources: readonly { path: string; content: string }[]): MissionGraphError[] {
  const errors: MissionGraphError[] = [];
  const forbiddenTokens = [
    "dispatch(",
    "settimeout(",
    "setinterval(",
    "queue",
    "worker",
    "retryloop",
    "repairreplay",
    "resumecoordination",
    "authorizeexecution",
    "advancelifecycle",
  ];
  for (const source of sources) {
    const lowered = source.content
      .replace(/(["'`])(?:\\.|(?!\1)[\s\S])*\1/g, "")
      .toLowerCase()
      .replace(/\s+/g, "");
    for (const token of forbiddenTokens) {
      if (lowered.includes(token)) {
        errors.push(createMissionGraphError(
          token.includes("settimeout") || token.includes("setinterval")
            ? "MISSION_GRAPH_SCHEDULING_REJECTED"
            : token.includes("dispatch") || token.includes("authorizeexecution")
              ? "MISSION_GRAPH_EXECUTION_INFERENCE_REJECTED"
              : token.includes("advancelifecycle")
                ? "MISSION_GRAPH_LIFECYCLE_MUTATION_REJECTED"
                : token.includes("repairreplay")
                  ? "MISSION_GRAPH_REPLAY_REPAIR_REJECTED"
                  : "MISSION_GRAPH_ORCHESTRATION_REJECTED",
          `Mission graph source contains forbidden operational token "${token}".`,
          source.path,
        ));
      }
    }
  }
  return errors;
}
