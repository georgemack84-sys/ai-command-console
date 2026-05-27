export type TelemetryEscalationRecord = Readonly<{
  escalationId: string;
  sourceId: string;
  escalationFailureDetected: boolean;
  deterministicHash: string;
}>;
