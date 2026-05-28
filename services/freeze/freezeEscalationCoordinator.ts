import type { CoordinationFreezeRecord, DriftRecord } from "@/types/freshness";
import { hashFreshnessValue } from "@/services/freshness/freshnessHasher";

export function coordinateFreezeEscalation(input: {
  proposalId: string;
  drifts: readonly DriftRecord[];
  replayIntegrity: "verified" | "mismatch" | "quarantined";
  freshnessStatus: "fresh" | "revalidation_required" | "stale" | "expired" | "frozen";
  createdAt: string;
}): CoordinationFreezeRecord {
  const frozen = input.replayIntegrity !== "verified"
    || input.freshnessStatus === "expired"
    || input.drifts.some((drift) => drift.freezeRequired);

  const reasonCodes = Object.freeze([
    ...(input.replayIntegrity !== "verified" ? [`replay:${input.replayIntegrity}`] : []),
    ...(input.freshnessStatus === "expired" ? ["freshness:expired"] : []),
    ...input.drifts.filter((drift) => drift.freezeRequired).map((drift) => `drift:${drift.driftType}`),
  ]);

  return Object.freeze({
    freezeId: hashFreshnessValue("coordination-freeze-id", {
      proposalId: input.proposalId,
      createdAt: input.createdAt,
    }),
    proposalId: input.proposalId,
    frozen,
    terminalContainment: true,
    visibilityRestricted: frozen,
    escalationRequired: frozen || input.drifts.some((drift) => drift.requiresEscalation),
    replayQuarantined: input.replayIntegrity === "quarantined",
    reasonCodes,
    freezeHash: hashFreshnessValue("coordination-freeze-record", {
      proposalId: input.proposalId,
      frozen,
      reasonCodes,
      createdAt: input.createdAt,
    }),
    createdAt: input.createdAt,
  });
}
