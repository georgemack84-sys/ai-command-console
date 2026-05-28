import { hashEvidence } from "../audit/evidenceHashing";

export function buildCoordinationLineage(input: {
  coordinationId: string;
  participatingSystems: string[];
  dependencyOrdering: string[];
  enforcementReferences: string[];
}) {
  const lineage = {
    coordinationId: input.coordinationId,
    participatingSystems: Array.from(new Set(input.participatingSystems)).sort(),
    dependencyOrdering: [...input.dependencyOrdering],
    enforcementReferences: Array.from(new Set(input.enforcementReferences)).sort(),
  };
  return {
    ...lineage,
    immutableLineageHash: hashEvidence(lineage),
  };
}
