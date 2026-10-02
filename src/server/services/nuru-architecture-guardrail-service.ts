import { type VaultRecord } from "@/src/nuru/vault-contracts";

export type GuardrailFinding = { code: "MISSING_CANDIDATE" | "MISSING_HUMAN_APPROVAL" | "MISSING_ARCHITECTURE_CONTEXT" | "MISSING_REQUIREMENT" | "MISSING_QUALIFICATION"; severity: "ERROR" | "WARNING"; recordId: string; message: string };
export interface GuardrailStore { readVaultRecords(): Promise<VaultRecord[]>; }

/** Read-only invariant checks: no agent or projection may repair a violated authority boundary. */
export const NuruArchitectureGuardrailService = {
  async inspect(store: GuardrailStore): Promise<GuardrailFinding[]> {
    const records = await store.readVaultRecords(); const ids = new Set(records.map((record) => record.id)); const approvals = new Map(records.filter((record): record is Extract<VaultRecord, { kind: "GOVERNANCE_DECISION" }> => record.kind === "GOVERNANCE_DECISION").map((record) => [record.id, record])); const findings: GuardrailFinding[] = [];
    for (const record of records) {
      if ("candidateId" in record && !ids.has(record.candidateId)) findings.push({ code: "MISSING_CANDIDATE", severity: "ERROR", recordId: record.id, message: "A governed record cites a candidate that is not retained in the Vault." });
      if ("governanceDecisionId" in record) { const approval = approvals.get(record.governanceDecisionId); if (!approval || approval.outcome !== "APPROVED" || !approval.humanApprovalId) findings.push({ code: "MISSING_HUMAN_APPROVAL", severity: "ERROR", recordId: record.id, message: "A governed record lacks a retained human-approved governance decision." }); }
      if (record.kind === "PROJECT_REQUIREMENT" && !ids.has(record.projectDecisionId)) findings.push({ code: "MISSING_ARCHITECTURE_CONTEXT", severity: "ERROR", recordId: record.id, message: "A requirement lacks retained architecture-decision context." });
      if (record.kind === "CODEX_BUILD_PACKAGE") { for (const requirementId of record.requirementIds) if (!ids.has(requirementId)) findings.push({ code: "MISSING_REQUIREMENT", severity: "ERROR", recordId: record.id, message: "A build package cites a requirement that is not retained in the Vault." }); }
      if (record.kind === "CODEX_IMPLEMENTATION_LEDGER" && record.qualificationStatus === "QUALIFIED" && record.testsExecuted.length === 0) findings.push({ code: "MISSING_QUALIFICATION", severity: "WARNING", recordId: record.id, message: "A qualified implementation ledger has no recorded test execution." });
    }
    return findings.sort((left, right) => left.recordId.localeCompare(right.recordId) || left.code.localeCompare(right.code));
  },
};
