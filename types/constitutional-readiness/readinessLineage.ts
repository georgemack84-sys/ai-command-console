import type { ImmutableAuditLedgerEntry } from "@/services/audit/immutableAuditLedger";
import type { ReadinessClassification } from "./readinessClassification";
import type { ReadinessRiskLevel } from "./readinessRisk";

export type ReadinessLineageEntry = Readonly<{
  entryId: string;
  readinessId: string;
  coordinationId: string;
  readinessClassification: ReadinessClassification;
  riskLevel: ReadinessRiskLevel;
  createdAt: string;
  deterministicHash: string;
}>;

export type ReadinessLineageLedger = Readonly<{
  entries: readonly ReadinessLineageEntry[];
  lineageHash: string;
}>;

export type ReadinessLineageGraph = Readonly<{
  graphId: string;
  nodes: readonly Readonly<{
    nodeId: string;
    readinessId: string;
    classification: ReadinessClassification;
  }>[];
  edges: readonly Readonly<{
    from: string;
    to: string;
    deterministicHash: string;
  }>[];
  graphHash: string;
}>;

export type ReadinessLedgerEntry = ImmutableAuditLedgerEntry<Readonly<Record<string, unknown>>>;
