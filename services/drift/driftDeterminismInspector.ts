import type { CoordinationDriftReport, FreshnessError } from "@/types/freshness";
import { hashFreshnessValue } from "@/services/freshness/freshnessHasher";
import { serializeFreshnessValue } from "@/services/freshness/freshnessSerializer";
import { createFreshnessError } from "@/services/freshness/freshnessGuards";

export function inspectDriftDeterminism(report: CoordinationDriftReport): readonly FreshnessError[] {
  const left = serializeFreshnessValue(report);
  const right = serializeFreshnessValue(report);
  const leftHash = hashFreshnessValue("drift-determinism", report);
  const rightHash = hashFreshnessValue("drift-determinism", report);

  return Object.freeze(
    left !== right || leftHash !== rightHash
      ? [createFreshnessError(
        "FRESHNESS_NON_DETERMINISTIC_OUTPUT",
        "Drift classification produced non-deterministic output.",
        "report",
      )]
      : [],
  );
}
