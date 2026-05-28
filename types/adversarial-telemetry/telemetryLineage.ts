export type TelemetryLineageEntry = Readonly<{
  entryId: string;
  telemetryId: string;
  coordinationId: string;
  telemetryState: "stable" | "elevated" | "frozen" | "blocked" | "disputed";
  createdAt: string;
  deterministicHash: string;
}>;

export type TelemetryLineageLedger = Readonly<{
  ledgerId: string;
  entries: readonly TelemetryLineageEntry[];
  lineageHash: string;
}>;

export type TelemetryLedgerEntry = Readonly<{
  ledgerId: string;
  previousHash: string | null;
  entryHash: string;
  payload: Readonly<Record<string, unknown>>;
}>;
