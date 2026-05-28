import { hashStableContent } from "@/services/planning/versioning/stable-content-hasher";

function normalize(value: unknown): unknown {
  if (value === undefined) {
    return null;
  }
  if (typeof value === "string") {
    return value.normalize("NFC");
  }
  if (Array.isArray(value)) {
    return value.map(normalize);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value as Record<string, unknown>)
        .sort((left, right) => left.localeCompare(right))
        .map((key) => [key, normalize((value as Record<string, unknown>)[key])]),
    );
  }
  return value;
}

export function hashApprovalGraphValue(label: string, value: unknown): string {
  return hashStableContent("EVIDENCE_BUNDLE", {
    label,
    engineVersion: "4.5D",
    value: normalize(value),
  });
}
