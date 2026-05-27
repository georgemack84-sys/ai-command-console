import { createHash } from "node:crypto";

import {
  RECOVERY_EVIDENCE_HASH_ALGORITHM,
} from "../../constants/recoveryEvidence.constants";
import type { RecoveryEvidenceBundle } from "../../types/recoveryEvidence";

function stableSerialize(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableSerialize(entry)).join(",")}]`;
  }
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, entry]) => entry !== undefined)
    .sort(([left], [right]) => left.localeCompare(right));
  return `{${entries
    .map(([key, entry]) => `${JSON.stringify(key)}:${stableSerialize(entry)}`)
    .join(",")}}`;
}

export function hashRecoveryEvidence(bundle: RecoveryEvidenceBundle): string {
  const normalized = {
    ...bundle,
    integrity: {
      ...bundle.integrity,
      hash: "",
    },
  };
  return createHash(RECOVERY_EVIDENCE_HASH_ALGORITHM)
    .update(stableSerialize(normalized))
    .digest("hex");
}

