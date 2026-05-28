import type {
  HumanCoordinationOverrideError,
  HumanCoordinationOverrideInput,
} from "@/types/human-coordination-override";

function error(
  code: HumanCoordinationOverrideError["code"],
  message: string,
  path?: string,
): HumanCoordinationOverrideError {
  return Object.freeze({ code, message, path });
}

export function validateOverrideConsistency(
  input: HumanCoordinationOverrideInput,
): readonly HumanCoordinationOverrideError[] {
  const errors: HumanCoordinationOverrideError[] = [];

  if (input.coordinationRecord.governanceSnapshotId !== input.coordinationReplay.governance.governanceSnapshotId) {
    errors.push(error(
      "HUMAN_COORDINATION_OVERRIDE_GOVERNANCE_MISMATCH",
      "Override replay must bind to the original governance snapshot.",
      "coordinationReplay.governance.governanceSnapshotId",
    ));
  }

  if (input.coordinationRecord.governanceSnapshotId !== input.escalationResult.record.governanceSnapshotId) {
    errors.push(error(
      "HUMAN_COORDINATION_OVERRIDE_GOVERNANCE_MISMATCH",
      "Override must preserve the original escalation governance snapshot.",
      "escalationResult.record.governanceSnapshotId",
    ));
  }

  if (input.coordinationRecord.replaySnapshotId !== input.coordinationReplay.routing.replaySnapshotId) {
    errors.push(error(
      "HUMAN_COORDINATION_OVERRIDE_REPLAY_INCONSISTENCY",
      "Override must preserve the original replay snapshot and routing evidence.",
      "coordinationReplay.routing.replaySnapshotId",
    ));
  }

  if (input.coordinationRecord.replaySnapshotId !== input.escalationResult.record.replaySnapshotId) {
    errors.push(error(
      "HUMAN_COORDINATION_OVERRIDE_REPLAY_INCONSISTENCY",
      "Override must preserve the original escalation replay snapshot.",
      "escalationResult.record.replaySnapshotId",
    ));
  }

  if (input.coordinationReplay.state === "fail_closed" || input.coordinationReplay.errors.some((item) => item.code.includes("AMBIGUITY"))) {
    errors.push(error(
      "HUMAN_COORDINATION_OVERRIDE_REPLAY_AMBIGUITY",
      "Replay ambiguity prevents safe override reconstruction.",
      "coordinationReplay.state",
    ));
  }

  if (input.orchestrationRecord.containment.inheritedState === "fail_closed") {
    errors.push(error(
      "HUMAN_COORDINATION_OVERRIDE_CONTAINMENT_BYPASS",
      "Human override may not bypass inherited containment failure.",
      "orchestrationRecord.containment.inheritedState",
    ));
  }

  if (!input.escalationResult.lineage.entries.length) {
    errors.push(error(
      "HUMAN_COORDINATION_OVERRIDE_MISSING_LINEAGE",
      "Escalation lineage is required for override reconstruction.",
      "escalationResult.lineage.entries",
    ));
  }

  const serialized = JSON.stringify(input.metadata ?? {}).toLowerCase();
  if (serialized.includes("recursiveoverride")) {
    errors.push(error(
      "HUMAN_COORDINATION_OVERRIDE_RECURSIVE_MARKER",
      "Recursive override markers are forbidden.",
      "metadata.recursiveOverride",
    ));
  }
  if (serialized.includes("restore") || serialized.includes("reviverouting")) {
    errors.push(error(
      "HUMAN_COORDINATION_OVERRIDE_ROUTING_RESTORATION",
      "Override cannot silently restore routing or coordination.",
      "metadata.restore",
    ));
  }
  if (serialized.includes("mutatechronology")) {
    errors.push(error(
      "HUMAN_COORDINATION_OVERRIDE_LINEAGE_CORRUPTION",
      "Chronology mutation markers are forbidden.",
      "metadata.mutateChronology",
    ));
  }

  return Object.freeze(errors);
}
