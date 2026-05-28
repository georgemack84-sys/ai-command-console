import type { ImmutableRecommendationLedgerError } from "./types/immutableRecommendationLedgerTypes";

function isIsoTimestamp(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value);
}

export function validateLedgerTimestamp(timestamp: string, path: string): ImmutableRecommendationLedgerError[] {
  if (!isIsoTimestamp(timestamp)) {
    return [{
      code: "LEDGER_TIMESTAMP_MUTATION",
      message: "Ledger timestamps must be immutable ISO-8601 UTC strings.",
      path,
    }];
  }
  return [];
}
