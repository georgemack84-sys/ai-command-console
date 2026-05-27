import type { CoordinationReplayInput, CoordinationReplayResult, CoordinationReplayState } from "@/types/coordination-replay";
import { reconstructGovernanceSnapshot } from "@/services/governance-replay/governanceSnapshotReconstructor";
import { rebuildApprovalLineage } from "@/services/approval-replay/approvalLineageRebuilder";
import { replayEscalationState } from "@/services/escalation-replay/escalationReplayEngine";
import { replayOrchestrationBoundary } from "@/services/orchestration-replay/orchestrationBoundaryReplayer";
import { buildReplayTimelineEntries } from "./replayTimelineBuilder";
import { appendImmutableReplayLedger } from "@/services/lineage/immutableLineageLedger";
import { validateReplayConsistency } from "@/services/replay-validation/replayConsistencyValidator";
import { buildReplayEvidence } from "./replayEvidenceBuilder";
import { hashCoordinationReplayValue } from "./replayHashEngine";

function resolveReplayState(input: {
  errors: readonly string[];
  containmentState: string;
  orchestrationState: string;
}): CoordinationReplayState {
  if (input.errors.some((code) => code.includes("AMBIGUITY"))) {
    return "fail_closed";
  }
  if (input.errors.length > 0) {
    return "invalid";
  }
  if (input.containmentState === "frozen" || input.orchestrationState === "frozen") {
    return "frozen";
  }
  if (input.containmentState === "restricted" || input.orchestrationState === "restricted") {
    return "restricted";
  }
  return "reconstructed";
}

export function buildCoordinationReplay(input: CoordinationReplayInput): CoordinationReplayResult {
  const governance = reconstructGovernanceSnapshot(input);
  const approval = rebuildApprovalLineage(input);
  const escalation = replayEscalationState(input);
  const orchestration = replayOrchestrationBoundary(input);
  const timelineEntries = buildReplayTimelineEntries(input);
  const ledger = appendImmutableReplayLedger({
    existing: input.existingLedger,
    entries: timelineEntries,
  });
  const consistencyErrors = validateReplayConsistency({
    replayInput: input,
    governance,
    approval,
    escalation,
    orchestration,
    ledger,
  });
  const errorCodes = Object.freeze(consistencyErrors.map((error) => error.code));
  const state = resolveReplayState({
    errors: errorCodes,
    containmentState: input.orchestrationRecord.containment.inheritedState,
    orchestrationState: input.orchestrationRecord.orchestrationState,
  });
  const audit = buildReplayEvidence({
    replayInput: input,
    errors: errorCodes,
  });
  const authorityContract = Object.freeze({
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
  const base = Object.freeze({
    replayId: input.replayId,
    coordinationId: input.coordinationRecord.coordinationId,
    proposalId: input.coordinationRecord.proposalId,
    state,
    authorityContract,
    governance,
    approval,
    routing: input.routingResult.replayLog,
    escalation,
    orchestration,
    ledger,
    audit,
    warnings: Object.freeze([
      "Coordination replay remains reconstructive-only and cannot repair, continue, or operationalize history.",
    ]),
    errors: consistencyErrors,
    derivedOnly: true as const,
  });

  return Object.freeze({
    ...base,
    deterministicHash: hashCoordinationReplayValue("coordination-replay-result", base),
  });
}
