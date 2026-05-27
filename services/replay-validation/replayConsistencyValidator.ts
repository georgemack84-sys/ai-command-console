import type {
  ApprovalReplayView,
  CoordinationReplayError,
  CoordinationReplayInput,
  EscalationReplayView,
  GovernanceReplayView,
  ImmutableReplayLineageLedger,
  OrchestrationReplayView,
} from "@/types/coordination-replay";

function error(
  code: CoordinationReplayError["code"],
  message: string,
  path?: string,
): CoordinationReplayError {
  return Object.freeze({ code, message, path });
}

const FORBIDDEN_MARKERS = [
  "repairreplay",
  "synthesize",
  "continuation",
  "continueworkflow",
  "mutatechronology",
  "rewritehistory",
  "substitutegovernance",
];

export function validateReplayConsistency(input: {
  replayInput: CoordinationReplayInput;
  governance: GovernanceReplayView;
  approval: ApprovalReplayView;
  escalation: EscalationReplayView;
  orchestration: OrchestrationReplayView;
  ledger: ImmutableReplayLineageLedger;
}): readonly CoordinationReplayError[] {
  const errors: CoordinationReplayError[] = [];
  if (!input.governance.valid) {
    errors.push(error(
      "COORDINATION_REPLAY_GOVERNANCE_MISMATCH",
      "Historical governance snapshot was not valid and replay cannot substitute a newer one.",
      "governance.valid",
    ));
  }
  if (!input.approval.valid || !input.approval.explicit) {
    errors.push(error(
      "COORDINATION_REPLAY_APPROVAL_INCONSISTENCY",
      "Approval replay requires explicit valid historical approval.",
      "approval",
    ));
  }
  if (!input.escalation.replaySafe) {
    errors.push(error(
      "COORDINATION_REPLAY_ESCALATION_INCONSISTENCY",
      "Escalation replay was not marked replay-safe historically.",
      "escalation.replaySafe",
    ));
  }
  if (input.orchestration.containmentState === "fail_closed" || input.orchestration.orchestrationState === "invalid") {
    errors.push(error(
      "COORDINATION_REPLAY_CONTAINMENT_BYPASS",
      "Orchestration containment failed closed and replay cannot bypass it.",
      "orchestration",
    ));
  }
  if (input.ledger.entries.length < 5) {
    errors.push(error(
      "COORDINATION_REPLAY_LINEAGE_CORRUPTION",
      "Replay lineage is incomplete and cannot be reconstructed safely.",
      "ledger.entries",
    ));
  }
  if (
    input.replayInput.coordinationRecord.replayBinding.replaySnapshotId !==
    input.replayInput.routingResult.replaySnapshotId
  ) {
    errors.push(error(
      "COORDINATION_REPLAY_AMBIGUITY",
      "Replay snapshot mismatch prevents immutable reconstruction.",
      "replaySnapshotId",
    ));
  }
  const serialized = JSON.stringify(input.replayInput.metadata ?? {}).toLowerCase();
  for (const marker of FORBIDDEN_MARKERS) {
    if (serialized.includes(marker)) {
      errors.push(error(
        marker.includes("substitute")
          ? "COORDINATION_REPLAY_GOVERNANCE_MISMATCH"
          : marker.includes("mutate") || marker.includes("rewrite")
            ? "COORDINATION_REPLAY_HISTORY_MUTATION"
            : "COORDINATION_REPLAY_SYNTHETIC_CONTINUITY",
        "Forbidden replay mutation or synthetic continuity marker was detected.",
        `metadata.${marker}`,
      ));
    }
  }
  return Object.freeze(errors);
}
