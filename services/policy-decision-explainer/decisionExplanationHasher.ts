import { hashStableContent } from "@/services/planning/versioning/stable-content-hasher";

function stripUndefined(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(stripUndefined);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, nested]) => nested !== undefined)
        .map(([key, nested]) => [key, stripUndefined(nested)]),
    );
  }
  return value;
}

export function hashPolicyDecisionExplanationValue(label: string, value: unknown): string {
  return hashStableContent("EVIDENCE_BUNDLE", {
    label,
    value: stripUndefined(value),
  });
}
