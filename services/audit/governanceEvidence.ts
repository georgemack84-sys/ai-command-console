import type { EvidenceCategory } from "../../types/audit";

export type GovernanceEvidenceBundle = {
  evidenceId: string;
  categories: EvidenceCategory[];
  evidenceRefs: string[];
  referencesByCategory: Record<EvidenceCategory, string[]>;
};

export function buildGovernanceEvidenceBundle(input: {
  evidenceRefs: Partial<Record<EvidenceCategory, string[]>>;
  scope: string;
}) : GovernanceEvidenceBundle {
  const categories = Object.keys(input.evidenceRefs)
    .sort()
    .filter((category) => (input.evidenceRefs[category as EvidenceCategory] ?? []).length > 0) as EvidenceCategory[];

  if (categories.length === 0) {
    throw new Error("governance_evidence_missing");
  }

  const referencesByCategory = categories.reduce<Record<EvidenceCategory, string[]>>((accumulator, category) => {
    accumulator[category] = Array.from(new Set(input.evidenceRefs[category] ?? [])).sort();
    return accumulator;
  }, {} as Record<EvidenceCategory, string[]>);

  const evidenceRefs = categories.flatMap((category) => referencesByCategory[category]);

  return {
    evidenceId: `evidence:${input.scope}:${categories.join("-").toLowerCase()}`,
    categories,
    evidenceRefs,
    referencesByCategory,
  };
}

export function validateGovernanceEvidenceBundle(bundle: GovernanceEvidenceBundle) {
  return bundle.categories.length > 0 && bundle.evidenceRefs.length > 0;
}
