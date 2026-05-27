import { hashStableContent } from "@/services/planning/versioning/stable-content-hasher";
import { canonicalizeSnapshotValue } from "./snapshotCanonicalSerializer";

export const DETERMINISTIC_SNAPSHOT_ENGINE_VERSION = "4.4F";

export function hashSnapshotValue(label: string, value: unknown): string {
  return hashStableContent("EVIDENCE_BUNDLE", {
    label,
    engineVersion: DETERMINISTIC_SNAPSHOT_ENGINE_VERSION,
    value: canonicalizeSnapshotValue(value),
  });
}
