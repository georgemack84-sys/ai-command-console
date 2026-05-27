export function buildConstitutionalEvidenceLedger(input: {
  evidenceRefs: string[];
  derivedFrom: string[];
  createdAt: number;
}) {
  return {
    ledgerId: `constitutional-evidence-ledger:${input.createdAt}`,
    evidenceRefs: [...new Set(input.evidenceRefs)].sort(),
    derivedFrom: [...new Set(input.derivedFrom)].sort(),
    appendOnly: true as const,
    advisoryOnly: true as const,
    createdAt: input.createdAt,
  };
}
