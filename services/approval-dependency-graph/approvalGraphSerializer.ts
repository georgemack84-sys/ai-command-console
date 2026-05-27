import { normalizeApprovalGraphValue } from "./approvalGraphNormalizer";

export function serializeApprovalGraphValue(value: unknown): string {
  return JSON.stringify(normalizeApprovalGraphValue(value));
}
