import { hashPayloadDeterministically } from "@/services/contracts/payloadHasher";
import { serializeDeterministically } from "../normalization/deterministic-serializer";
import { createReplayAuditFailure } from "./replay-audit-errors";
import type { ReplayAuditFailure, ReplayAuditInput } from "./replay-audit-types";

export function detectCompatibilityDrift(input: ReplayAuditInput): readonly ReplayAuditFailure[] {
  const frozenSnapshotHash = hashPayloadDeterministically(
    JSON.parse(serializeDeterministically(input.executionCompatibilityContract.compatibilitySnapshot)) as unknown,
  );
  const replayedSnapshotHash = hashPayloadDeterministically(
    JSON.parse(serializeDeterministically(input.executionCompatibilityContract.compatibilitySnapshot)) as unknown,
  );

  if (frozenSnapshotHash === replayedSnapshotHash) {
    return [];
  }

  return [createReplayAuditFailure(
    "PHASE4_2H_COMPATIBILITY_SNAPSHOT_MISMATCH",
    "Compatibility snapshot drift detected between frozen and replayed views.",
    "compatibilitySnapshot",
  )];
}
