import type { ExpandedConstitutionalAuditRecord } from "../../types/audit";

export function exportEvidenceBundleAsJson(input: {
  record: ExpandedConstitutionalAuditRecord;
  disputes: string[];
  replayState: string;
}) {
  return JSON.stringify({
    record: input.record,
    disputes: input.disputes,
    replayState: input.replayState,
  }, null, 2);
}

export function exportEvidenceBundleAsMarkdown(input: {
  record: ExpandedConstitutionalAuditRecord;
  disputes: string[];
  replayState: string;
}) {
  return [
    `# Constitutional Audit ${input.record.auditId}`,
    "",
    `- Governance Action: ${input.record.governanceAction}`,
    `- Constitutional State: ${input.record.constitutionalState}`,
    `- Replay State: ${input.replayState}`,
    `- Immutable Hash: ${input.record.immutableHash}`,
    `- Disputes: ${input.disputes.length ? input.disputes.join(", ") : "none"}`,
    "",
    "## Evidence",
    ...input.record.evidence.map((entry) => `- ${entry}`),
  ].join("\n");
}
