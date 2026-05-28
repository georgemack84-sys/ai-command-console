import { serializeDeterministically } from "@/services/planning/normalization/deterministic-serializer";

export function canonicalizeSnapshotValue(value: unknown): unknown {
  if (value === undefined) {
    return null;
  }

  if (typeof value === "string") {
    return value.normalize("NFC");
  }

  if (Array.isArray(value)) {
    return value.map(canonicalizeSnapshotValue);
  }

  if (value instanceof Set) {
    return [...value].map(canonicalizeSnapshotValue).sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)));
  }

  if (value instanceof Map) {
    return [...value.entries()]
      .map(([key, nested]) => [canonicalizeSnapshotValue(key), canonicalizeSnapshotValue(nested)] as const)
      .sort(([left], [right]) => JSON.stringify(left).localeCompare(JSON.stringify(right)));
  }

  if (value && typeof value === "object") {
    if (Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null) {
      throw new Error("SNAPSHOT_SCHEMA_INVALID");
    }

    return Object.fromEntries(
      Object.keys(value as Record<string, unknown>)
        .sort((left, right) => left.localeCompare(right))
        .map((key) => [key, canonicalizeSnapshotValue((value as Record<string, unknown>)[key])]),
    );
  }

  if (typeof value === "function" || typeof value === "symbol") {
    throw new Error("SNAPSHOT_SCHEMA_INVALID");
  }

  return value;
}

export function serializeSnapshotCanonically(value: unknown): string {
  return serializeDeterministically(canonicalizeSnapshotValue(value)).normalize("NFC");
}
