import type { ProposalFreshnessState, StaleClassification } from "@/types/freshness";
import { classifyCoordinationRisk } from "./coordinationRiskClassifier";
import { hashFreshnessValue } from "@/services/freshness/freshnessHasher";

export function classifyStaleIntent(input: {
  state: ProposalFreshnessState;
  createdAt: string;
}): StaleClassification {
  const risk = classifyCoordinationRisk(input.state.detectedDrifts);
  const classification =
    input.state.freshnessStatus === "fresh" ? "aging"
    : input.state.freshnessStatus === "revalidation_required" ? "revalidation_required"
    : input.state.freshnessStatus === "stale" ? "stale"
    : input.state.freshnessStatus === "expired" ? "expired"
    : "frozen";
  const governanceRestriction =
    input.state.freshnessStatus === "fresh" ? "none"
    : input.state.freshnessStatus === "revalidation_required" ? "review_required"
    : input.state.freshnessStatus === "stale" ? "restricted"
    : "blocked";

  return Object.freeze({
    proposalId: input.state.proposalId,
    classification,
    severity: risk.severity,
    governanceRestriction,
    reasonCodes: Object.freeze([
      `freshness:${input.state.freshnessStatus}`,
      `confidence:${input.state.confidenceState}`,
      `replay:${input.state.replayIntegrity}`,
      `governance:${input.state.governanceCompatibility}`,
    ]),
    classificationHash: hashFreshnessValue("stale-intent-classification", {
      state: input.state,
      createdAt: input.createdAt,
    }),
    createdAt: input.createdAt,
  });
}
