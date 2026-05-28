export type TelemetryConfidenceRecord = Readonly<{
  confidenceId: string;
  sourceId: string;
  volatilityDetected: boolean;
  deterministicHash: string;
}>;
