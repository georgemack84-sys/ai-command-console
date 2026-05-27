import type {
  ConstitutionalTelemetryError,
  ConstitutionalTelemetryInput,
  TelemetryEvent,
} from "./telemetryStateTypes";
import { normalizeTelemetryMetadata } from "./telemetrySchemas";
import { hashConstitutionalTelemetryValue } from "./telemetryHashingEngine";

export function detectRecommendationAnomalies(
  input: ConstitutionalTelemetryInput,
): Readonly<{
  event: TelemetryEvent;
  errors: readonly ConstitutionalTelemetryError[];
}> {
  const metadata = normalizeTelemetryMetadata(input.metadata);
  const triggered = metadata.includes("recommendationanomaly")
    || input.constitutionalReplayResult.replayState.recommendationState === "frozen";
  const errors = triggered
    ? [Object.freeze({
      code: "CONSTITUTIONAL_TELEMETRY_RECOMMENDATION_ANOMALY" as const,
      message: "Telemetry detected recommendation anomalies or frozen recommendation state.",
      path: "constitutionalReplayResult.replayState.recommendationState",
    })]
    : [];
  return Object.freeze({
    event: Object.freeze({
      telemetryId: input.telemetryId,
      domain: "recommendation_anomaly",
      triggered,
      severity: triggered ? "moderate" : "none",
      reason: triggered ? "Recommendation lineage exhibited anomaly markers or constitutional freezing." : "Recommendation lineage remained advisory-only and stable.",
      deterministicHash: hashConstitutionalTelemetryValue("constitutional-telemetry-recommendation-event", {
        telemetryId: input.telemetryId,
        triggered,
      }),
    }),
    errors: Object.freeze(errors),
  });
}
