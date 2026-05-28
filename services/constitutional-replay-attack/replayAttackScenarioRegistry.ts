import type {
  ConstitutionalReplayAttackInput,
  ConstitutionalReplayScenarioRecord,
} from "@/types/constitutional-replay";
import { hashConstitutionalReplayValue } from "./deterministicReplayHasher";

function normalizeMarkers(input: unknown, buffer: string[]): void {
  if (typeof input === "string") {
    buffer.push(input.toLowerCase().replace(/[^a-z0-9]+/g, ""));
    return;
  }
  if (Array.isArray(input)) {
    for (const item of input) {
      normalizeMarkers(item, buffer);
    }
    return;
  }
  if (input && typeof input === "object") {
    for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
      buffer.push(key.toLowerCase().replace(/[^a-z0-9]+/g, ""));
      normalizeMarkers(value, buffer);
    }
  }
}

export function registerReplayAttackScenario(
  input: ConstitutionalReplayAttackInput,
): ConstitutionalReplayScenarioRecord {
  const markers: string[] = [];
  normalizeMarkers(input.metadata, markers);
  const record = Object.freeze({
    scenarioId: hashConstitutionalReplayValue("scenario-id", {
      replayAttackId: input.replayAttackId,
      category: input.scenarioCategory,
      seed: input.deterministicSeed,
    }),
    category: input.scenarioCategory,
    version: "v1" as const,
    governanceSnapshotId: input.approvalConflictResult.record.governanceSnapshotId,
    replaySnapshotId: input.approvalConflictResult.record.replaySnapshotId,
    escalationSnapshotId: input.approvalConflictResult.record.escalationSnapshotId,
    approvalLineageId: input.approvalConflictResult.lineage.lineageId,
    dependencyLineageId: input.approvalConflictResult.evidence.recommendationLineageId,
    deterministicSeed: input.deterministicSeed,
    markers: Object.freeze(markers.sort()),
  });
  return Object.freeze({
    ...record,
    scenarioHash: hashConstitutionalReplayValue("scenario", record),
  });
}
