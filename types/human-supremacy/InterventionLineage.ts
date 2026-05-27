import type { InterventionLedgerEntry } from "./InterventionLedgerEntry";

export type InterventionLineage = Readonly<{
  lineageId: string;
  entries: readonly InterventionLedgerEntry[];
  lineageHash: string;
}>;
