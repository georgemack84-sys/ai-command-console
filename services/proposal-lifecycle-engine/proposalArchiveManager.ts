import type { ProposalLineageLedger } from "@/types/proposal-lifecycle-engine";

export function archiveProposalLineage(lineage: ProposalLineageLedger, resultingState: string): ProposalLineageLedger {
  if (resultingState !== "archived") {
    return lineage;
  }
  return Object.freeze({
    ...lineage,
    archived: true,
  });
}
