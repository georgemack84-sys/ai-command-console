import { stableSerializeEvidence } from "@/services/audit/evidenceHashing";

export function normalizeIntentInput(rawInput: string) {
  return rawInput
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\u0000/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\s+\n/g, "\n")
    .trim();
}

export function normalizeIntentPayload(rawInput: unknown) {
  if (typeof rawInput !== "string") {
    throw new Error("INVALID_INPUT");
  }
  return normalizeIntentInput(rawInput || stableSerializeEvidence(rawInput));
}
