import { canonicalSerialize } from "../contracts/canonicalSerializer";
import { hashPayloadDeterministically } from "../contracts/payloadHasher";
import type { BackupManifest, BackupSnapshot } from "./backupTypes";

export function serializeSnapshot(snapshot: BackupSnapshot) {
  return canonicalSerialize(snapshot);
}

export function serializeManifest(manifest: BackupManifest) {
  return canonicalSerialize(manifest);
}

export function computeSnapshotHash(snapshot: BackupSnapshot) {
  return hashPayloadDeterministically(snapshot);
}

export function computeSectionHash(section: unknown) {
  return hashPayloadDeterministically(section);
}
