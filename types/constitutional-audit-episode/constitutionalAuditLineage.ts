import type { ConstitutionalAuditSeverity } from "./constitutionalAuditSeverity";

export type LineageRef = Readonly<{
  lineageId: string;
  sourceId: string;
  sourceType: string;
  deterministicHash: string;
}>;

export type ConstitutionalAuditLineageEntry = Readonly<{
  entryId: string;
  episodeId: string;
  coordinationId: string;
  episodeState: "verified" | "frozen" | "blocked" | "disputed";
  disputeDetected: boolean;
  createdAt: string;
  deterministicHash: string;
}>;

export type ConstitutionalAuditLineageLedger = Readonly<{
  ledgerId: string;
  entries: readonly ConstitutionalAuditLineageEntry[];
  lineageHash: string;
}>;

export type ConstitutionalAuditLineageGraph = Readonly<{
  graphId: string;
  nodeIds: readonly string[];
  edgeIds: readonly string[];
  recursive: boolean;
  graphHash: string;
}>;

export type ConstitutionalAuditLedgerEntry = Readonly<{
  ledgerId: string;
  previousHash: string | null;
  entryHash: string;
  payload: Readonly<Record<string, unknown>>;
}>;

export type ConstitutionalRiskAnalysisRecord = Readonly<{
  analysisId: string;
  category: string;
  severity: ConstitutionalAuditSeverity;
  rationale: string;
  advisoryOnly: true;
  deterministicHash: string;
}>;
