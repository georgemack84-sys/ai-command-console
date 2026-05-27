export type TelemetryApprovalRecord = Readonly<{
  approvalId: string;
  sourceId: string;
  instabilityDetected: boolean;
  deterministicHash: string;
}>;
