import type { ConstitutionalAuditRecord, ExpandedConstitutionalAuditRecord, GovernanceReasoning } from "../../types/audit";
import { appendImmutableLedgerEntry } from "./immutableAuditLedger";
import { hashEvidence } from "./evidenceHashing";

function buildImmutableHash(input: Omit<ExpandedConstitutionalAuditRecord, "immutableHash">) {
  return hashEvidence(input);
}

export function createExpandedConstitutionalAuditRecord(input: {
  record: Omit<ExpandedConstitutionalAuditRecord, "immutableHash">;
  reasoning: GovernanceReasoning;
}) : ExpandedConstitutionalAuditRecord {
  if (input.record.evidence.length === 0) {
    throw new Error("constitutional_audit_missing_evidence");
  }
  if (input.record.governanceAction === "DENY" && input.reasoning.explanation.length === 0) {
    throw new Error("constitutional_audit_missing_reasoning");
  }

  return {
    ...input.record,
    immutableHash: buildImmutableHash(input.record),
  };
}

export function createConstitutionalAuditRecord(input: {
  governanceAction: ConstitutionalAuditRecord["governanceAction"];
  constitutionalState: ConstitutionalAuditRecord["constitutionalState"];
  evidence: string[];
  approvals: string[];
  escalationChain: string[];
  coordinationChain?: string[];
  coordinationSystems?: string[];
  operatorVisibility: boolean;
  timestamp: string;
}) : ConstitutionalAuditRecord {
  if (input.evidence.length === 0) {
    throw new Error("constitutional_audit_missing_evidence");
  }

  return {
    auditId: `audit:${hashEvidence({
      governanceAction: input.governanceAction,
      constitutionalState: input.constitutionalState,
      evidence: input.evidence,
      timestamp: input.timestamp,
    }).slice(0, 16)}`,
    governanceAction: input.governanceAction,
    constitutionalState: input.constitutionalState,
    evidence: Array.from(new Set(input.evidence)).sort(),
    approvals: Array.from(new Set(input.approvals)).sort(),
    escalationChain: Array.from(new Set(input.escalationChain)),
    coordinationChain: Array.from(new Set(input.coordinationChain ?? [])),
    coordinationSystems: Array.from(new Set(input.coordinationSystems ?? [])).sort(),
    operatorVisibility: input.operatorVisibility,
    timestamp: input.timestamp,
  };
}

export function appendConstitutionalAuditRecord(input: {
  record: ExpandedConstitutionalAuditRecord;
  previousHash?: string | null;
}) {
  return appendImmutableLedgerEntry({
    payload: input.record,
    previousHash: input.previousHash,
    scope: "constitutional-audit",
  });
}

export function getConstitutionalAuditView(record: ExpandedConstitutionalAuditRecord) {
  return {
    auditId: record.auditId,
    governanceAction: record.governanceAction,
    constitutionalState: record.constitutionalState,
    reasoningChain: record.reasoningChain,
    evidence: record.evidence,
    immutableHash: record.immutableHash,
  };
}
