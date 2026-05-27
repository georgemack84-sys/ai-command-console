import type { FreshnessWindow } from "@/types/freshness";
import { hashFreshnessValue } from "./freshnessHasher";

function addMs(timestamp: string, deltaMs: number): string {
  return new Date(Date.parse(timestamp) + deltaMs).toISOString();
}

export function resolveFreshnessPolicy(input: {
  proposalId: string;
  lifecycleState: string;
  lastValidatedAt: string;
}): FreshnessWindow {
  const maxAgeMs =
    input.lifecycleState === "bounded_handoff" ? 30 * 60 * 1000
    : input.lifecycleState === "bounded_coordination" ? 20 * 60 * 1000
    : 60 * 60 * 1000;
  const revalidationLeadMs = Math.floor(maxAgeMs * 0.5);
  const staleLeadMs = Math.floor(maxAgeMs * 0.8);
  const expiresAt = addMs(input.lastValidatedAt, maxAgeMs);

  return Object.freeze({
    policyId: hashFreshnessValue("freshness-policy-id", {
      proposalId: input.proposalId,
      lifecycleState: input.lifecycleState,
      lastValidatedAt: input.lastValidatedAt,
    }),
    maxAgeMs,
    revalidationLeadMs,
    staleLeadMs,
    expiresAt,
    policyHash: hashFreshnessValue("freshness-policy", {
      proposalId: input.proposalId,
      lifecycleState: input.lifecycleState,
      lastValidatedAt: input.lastValidatedAt,
      maxAgeMs,
      revalidationLeadMs,
      staleLeadMs,
      expiresAt,
    }),
  });
}
