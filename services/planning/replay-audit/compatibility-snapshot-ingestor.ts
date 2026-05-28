import { hashPayloadDeterministically } from "@/services/contracts/payloadHasher";
import { serializeDeterministically } from "../normalization/deterministic-serializer";
import type { ExecutionCompatibilityContract } from "../execution-compatibility";
import { createReplayAuditFailure } from "./replay-audit-errors";
import type {
  CompatibilityReplayReference,
  ReplayAuditFailure,
} from "./replay-audit-types";

type IngestedCompatibilitySnapshot = Readonly<{
  compatibilityReference?: CompatibilityReplayReference;
  compatibilitySnapshotHash?: string;
  failures: readonly ReplayAuditFailure[];
}>;

function scanMutableFields(value: unknown, path: string, failures: ReplayAuditFailure[]) {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => scanMutableFields(entry, `${path}[${index}]`, failures));
    return;
  }
  if (!value || typeof value !== "object") {
    return;
  }

  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    const lowered = key.toLowerCase();
    if (
      lowered.includes("timestamp")
      || lowered === "session"
      || lowered.includes("runtime")
      || lowered.includes("approvaldecision")
      || lowered.includes("network")
      || lowered.includes("result")
    ) {
      failures.push(createReplayAuditFailure(
        "PHASE4_2H_MUTABLE_REPLAY_INPUT_DETECTED",
        `Mutable replay input field detected at ${path ? `${path}.` : ""}${key}.`,
        path ? `${path}.${key}` : key,
      ));
    }
    scanMutableFields(nested, path ? `${path}.${key}` : key, failures);
  }
}

export function ingestCompatibilitySnapshot(contract: ExecutionCompatibilityContract): IngestedCompatibilitySnapshot {
  const failures: ReplayAuditFailure[] = [];
  if (!contract.executionTruthHash) {
    failures.push(createReplayAuditFailure(
      "PHASE4_2H_MISSING_EXECUTION_TRUTH_HASH",
      "Execution truth hash is required for replay/audit ingestion.",
      "executionTruthHash",
    ));
  }
  if (!contract.executionCompatibilityHash) {
    failures.push(createReplayAuditFailure(
      "PHASE4_2H_MISSING_EXECUTION_COMPATIBILITY_HASH",
      "Execution compatibility hash is required for replay/audit ingestion.",
      "executionCompatibilityHash",
    ));
  }
  if (!contract.compatibilitySnapshot) {
    failures.push(createReplayAuditFailure(
      "PHASE4_2H_MISSING_COMPATIBILITY_SNAPSHOT",
      "Compatibility snapshot is required for replay/audit ingestion.",
      "compatibilitySnapshot",
    ));
  }

  if (contract.compatibilitySnapshot) {
    scanMutableFields(contract.compatibilitySnapshot, "compatibilitySnapshot", failures);
  }

  if (failures.length > 0 || !contract.compatibilitySnapshot) {
    return { failures };
  }

  const compatibilitySnapshotHash = hashPayloadDeterministically(
    JSON.parse(serializeDeterministically(contract.compatibilitySnapshot)) as unknown,
  );

  return {
    compatibilityReference: {
      executionTruthHash: contract.executionTruthHash,
      executionCompatibilityHash: contract.executionCompatibilityHash,
      compatibilitySnapshotHash,
    },
    compatibilitySnapshotHash,
    failures,
  };
}
