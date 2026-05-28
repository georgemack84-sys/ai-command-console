import { canonicalizeEvidenceToString } from "./evidenceCanonicalizer";

export function serializeEvidenceValue(value: unknown): string {
  return canonicalizeEvidenceToString(value);
}
