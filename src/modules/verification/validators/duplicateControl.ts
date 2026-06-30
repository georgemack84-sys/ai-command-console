import type { MarketObservation } from "../../markets";
import type { StageVerificationResult } from "../records/verificationResult";

export type DuplicateStatus = "UNIQUE" | "DUPLICATE_BLOCKED" | "DUPLICATE_ALREADY_SEEN";

export function createDuplicateKey(observation: Partial<MarketObservation>): string {
  return JSON.stringify({
    source_id: observation.source_id,
    market_id: observation.market_id,
    market_type: observation.market_type,
    market_subtype: observation.market_subtype,
    participant: observation.participant,
    line_value: observation.line_value,
    odds_value: observation.odds_value,
    timestamp: observation.timestamp,
    ownership_hash: observation.ownership_hash,
  });
}

export function createDuplicateController(initialKeys: string[] = []) {
  const seen = new Set(initialKeys);

  return {
    check(observation: Partial<MarketObservation>): StageVerificationResult & { duplicate_status: DuplicateStatus } {
      const key = createDuplicateKey(observation);
      if (seen.has(key)) {
        return {
          status: "FAILED",
          failed_stage: "DUPLICATE_CONTROL",
          failure_reason: "DUPLICATE_ALREADY_SEEN",
          duplicate_status: "DUPLICATE_ALREADY_SEEN",
        };
      }
      return { status: "PASSED", duplicate_status: "UNIQUE" };
    },
    record(observation: Partial<MarketObservation>): DuplicateStatus {
      const key = createDuplicateKey(observation);
      if (seen.has(key)) return "DUPLICATE_ALREADY_SEEN";
      seen.add(key);
      return "UNIQUE";
    },
  };
}
