import type { ArtifactDiffView, ReplayDriftView } from "@/types/plan-diff-inspector";

function hasChangedPath(diff: ArtifactDiffView, pattern: RegExp): boolean {
  return diff.changedPaths.some((path) => pattern.test(path));
}

export function projectReplayDrift(input: {
  artifactDiff: ArtifactDiffView;
}): ReplayDriftView {
  const stepOrderChanged = input.artifactDiff.diffs.some((diff) => diff.diffType === "REORDERED" && /(steps|stepOrder)/i.test(diff.path));
  const dependencyChanged = hasChangedPath(input.artifactDiff, /dependenc/i);
  const toolBindingChanged = hasChangedPath(input.artifactDiff, /(toolBinding|toolId|adapter)/i);
  const inputChanged = hasChangedPath(input.artifactDiff, /(input|payload)/i);
  const evidenceChanged = hasChangedPath(input.artifactDiff, /evidence/i);
  const policySnapshotChanged = hasChangedPath(input.artifactDiff, /(policySnapshotHash|governanceSnapshotHash)/i);
  const replayHashChanged = hasChangedPath(input.artifactDiff, /(replayHash|replaySnapshotHash|replayBindingHash)/i);
  const changedFields = input.artifactDiff.changedPaths.filter((path) => /(replay|step|dependenc|toolBinding|input|evidence|policySnapshotHash|governanceSnapshotHash)/i.test(path));
  const unknownReplayDrift = changedFields.length === 0 && input.artifactDiff.driftClass === "UNKNOWN_DRIFT";
  const replayValid = !(stepOrderChanged || dependencyChanged || toolBindingChanged || inputChanged || evidenceChanged || policySnapshotChanged || replayHashChanged || unknownReplayDrift);

  return Object.freeze({
    driftClass: unknownReplayDrift
      ? "UNKNOWN_DRIFT"
      : changedFields.length > 0
        ? "REPLAY_DRIFT"
        : "NO_DRIFT",
    replayValid,
    changedFields: Object.freeze(changedFields),
    stepOrderChanged,
    dependencyChanged,
    toolBindingChanged,
    inputChanged,
    evidenceChanged,
    policySnapshotChanged,
    replayHashChanged,
    unknownReplayDrift,
  });
}
