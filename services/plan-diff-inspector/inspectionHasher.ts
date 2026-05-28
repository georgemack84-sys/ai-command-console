import { hashStableContent } from "@/services/planning/versioning/stable-content-hasher";

export const PLAN_DIFF_ENGINE_VERSION = "4.4D";

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value)
    && typeof value === "object"
    && !Array.isArray(value)
    && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
}

function stripUndefined(value: unknown): unknown {
  if (value === undefined) {
    return "__undefined__";
  }
  if (Array.isArray(value)) {
    return value.map(stripUndefined);
  }
  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.keys(value)
        .sort((left, right) => left.localeCompare(right))
        .filter((key) => value[key] !== undefined)
        .map((key) => [key, stripUndefined(value[key])]),
    );
  }
  return value;
}

export function canonicalizeInspectionValue(value: unknown): unknown {
  if (value === undefined) {
    return "__undefined__";
  }
  if (Array.isArray(value)) {
    return value.map(canonicalizeInspectionValue);
  }
  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.keys(value)
        .sort((left, right) => left.localeCompare(right))
        .map((key) => [key, canonicalizeInspectionValue(value[key])]),
    );
  }
  if (typeof value === "string") {
    return value.normalize("NFC");
  }
  return value;
}

export function hashPlanDiffInspectionValue(label: string, value: unknown): string {
  return hashStableContent("EVIDENCE_BUNDLE", {
    label,
    engineVersion: PLAN_DIFF_ENGINE_VERSION,
    value: stripUndefined(canonicalizeInspectionValue(value)),
  });
}

export function valueTypeOf(value: unknown): string {
  if (Array.isArray(value)) {
    return "array";
  }
  if (value === null) {
    return "null";
  }
  return typeof value;
}

export type HashLikeField = Readonly<{
  path: string;
  value: string;
}>;

export function collectHashLikeFields(value: unknown, path = ""): readonly HashLikeField[] {
  if (Array.isArray(value)) {
    return Object.freeze(value.flatMap((item, index) => collectHashLikeFields(item, `${path}[${index}]`)));
  }
  if (!isPlainObject(value)) {
    return Object.freeze([]);
  }

  const entries: HashLikeField[] = [];
  for (const key of Object.keys(value).sort((left, right) => left.localeCompare(right))) {
    const nextPath = path ? `${path}.${key}` : key;
    const nested = value[key];
    if (typeof nested === "string" && /hash/i.test(key)) {
      entries.push(Object.freeze({ path: nextPath, value: nested }));
    }
    entries.push(...collectHashLikeFields(nested, nextPath));
  }
  return Object.freeze(entries);
}

export function collectReferenceLikeFields(value: unknown, path = ""): readonly HashLikeField[] {
  if (Array.isArray(value)) {
    return Object.freeze(value.flatMap((item, index) => collectReferenceLikeFields(item, `${path}[${index}]`)));
  }
  if (!isPlainObject(value)) {
    return Object.freeze([]);
  }

  const entries: HashLikeField[] = [];
  for (const key of Object.keys(value).sort((left, right) => left.localeCompare(right))) {
    const nextPath = path ? `${path}.${key}` : key;
    const nested = value[key];
    if (typeof nested === "string" && /(ref|reference|id)$/i.test(key)) {
      entries.push(Object.freeze({ path: nextPath, value: nested }));
    }
    entries.push(...collectReferenceLikeFields(nested, nextPath));
  }
  return Object.freeze(entries);
}

export function collectNamedStringValues(
  value: unknown,
  matcher: (path: string, key: string, fieldValue: string) => boolean,
  path = "",
): readonly HashLikeField[] {
  if (Array.isArray(value)) {
    return Object.freeze(value.flatMap((item, index) => collectNamedStringValues(item, matcher, `${path}[${index}]`)));
  }
  if (!isPlainObject(value)) {
    return Object.freeze([]);
  }

  const entries: HashLikeField[] = [];
  for (const key of Object.keys(value).sort((left, right) => left.localeCompare(right))) {
    const nextPath = path ? `${path}.${key}` : key;
    const nested = value[key];
    if (typeof nested === "string" && matcher(nextPath, key, nested)) {
      entries.push(Object.freeze({ path: nextPath, value: nested }));
    }
    entries.push(...collectNamedStringValues(nested, matcher, nextPath));
  }
  return Object.freeze(entries);
}

export function collectNamedArrayValues(
  value: unknown,
  matcher: (path: string, key: string, fieldValue: readonly unknown[]) => boolean,
  path = "",
): readonly Readonly<{ path: string; values: readonly unknown[] }>[] {
  if (Array.isArray(value)) {
    return Object.freeze(value.flatMap((item, index) => collectNamedArrayValues(item, matcher, `${path}[${index}]`)));
  }
  if (!isPlainObject(value)) {
    return Object.freeze([]);
  }

  const entries: Array<Readonly<{ path: string; values: readonly unknown[] }>> = [];
  for (const key of Object.keys(value).sort((left, right) => left.localeCompare(right))) {
    const nextPath = path ? `${path}.${key}` : key;
    const nested = value[key];
    if (Array.isArray(nested) && matcher(nextPath, key, nested)) {
      entries.push(Object.freeze({ path: nextPath, values: Object.freeze([...nested]) }));
    }
    entries.push(...collectNamedArrayValues(nested, matcher, nextPath));
  }
  return Object.freeze(entries);
}

export function isHashString(value: string): boolean {
  return /^[a-f0-9]{64}$/i.test(value) || /^sha256:/i.test(value);
}
