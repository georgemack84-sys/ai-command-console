import { canonicalSerialize } from "@/services/contracts/canonicalSerializer";

function sanitize(value: unknown, seen: WeakSet<object>): unknown {
  if (value === undefined) {
    return null;
  }

  if (typeof value === "function") {
    throw new Error("PLAN_NORMALIZATION_NON_DETERMINISTIC");
  }

  if (Array.isArray(value)) {
    return value.map((entry) => sanitize(entry, seen));
  }

  if (value && typeof value === "object") {
    if (seen.has(value as object)) {
      throw new Error("PLAN_NORMALIZATION_NON_DETERMINISTIC");
    }
    seen.add(value as object);

    const result: Record<string, unknown> = {};
    try {
      for (const key of Object.keys(value as Record<string, unknown>).sort((left, right) => left.localeCompare(right))) {
        result[key] = sanitize((value as Record<string, unknown>)[key], seen);
      }
    } finally {
      seen.delete(value as object);
    }
    return result;
  }

  return value;
}

export function serializeDeterministically(value: unknown) {
  return canonicalSerialize(sanitize(value, new WeakSet()));
}
