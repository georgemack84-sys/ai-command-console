import type { ProposalFreshnessStatus, FreshnessWindow } from "@/types/freshness";

export function resolveFreshnessStatus(input: {
  validatedAt: string;
  evaluatedAt: string;
  window: FreshnessWindow;
}): ProposalFreshnessStatus {
  const validatedMs = Date.parse(input.validatedAt);
  const evaluatedMs = Date.parse(input.evaluatedAt);
  const ageMs = Math.max(0, evaluatedMs - validatedMs);

  if (evaluatedMs >= Date.parse(input.window.expiresAt)) {
    return "expired";
  }
  if (ageMs >= input.window.staleLeadMs) {
    return "stale";
  }
  if (ageMs >= input.window.revalidationLeadMs) {
    return "revalidation_required";
  }
  return "fresh";
}
