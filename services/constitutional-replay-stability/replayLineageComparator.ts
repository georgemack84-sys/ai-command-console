import type {
  ConstitutionalReplayStabilityError,
  ReplayBindingRecord,
  ReplayStabilityLineageLedger,
} from "./replayStateTypes";

export function compareReplayLineage(input: {
  binding: ReplayBindingRecord;
  existingLineage?: ReplayStabilityLineageLedger;
}): readonly ConstitutionalReplayStabilityError[] {
  if (input.existingLineage && input.existingLineage.entries.length > 0 && !input.binding.replayBound) {
    return Object.freeze([Object.freeze({
      code: "CONSTITUTIONAL_REPLAY_STABILITY_LINEAGE_BREAK",
      message: "Replay lineage comparison detected a binding mismatch with append-only lineage history.",
      path: "existingLineage",
    })]);
  }
  return Object.freeze([]);
}
