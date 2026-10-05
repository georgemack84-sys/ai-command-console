import { describe, expect, it } from "vitest";
import { type CanonicalRecord, type ProjectDecision, type VaultAuditEvent, type VaultCandidate, vaultSchemaVersion } from "@/src/nuru/vault-contracts";
import { NuruVaultPersistenceAdapter } from "@/src/server/repositories/nuru-vault-persistence-adapter";
import { type NuruPersistenceTransaction, type NuruVaultRecordRow } from "@/src/server/repositories/nuru-knowledge-repository";

const createdAt = "2026-09-30T12:00:00.000Z";
const correlationId = "c8d1df9a-ae91-4ea3-8718-9df8d6e9bc36";
const envelope = { schemaVersion: vaultSchemaVersion, classification: "PUBLIC" as const, createdAt, correlationId };
const candidate: VaultCandidate = { ...envelope, id: "candidate-1", kind: "CANDIDATE", evidenceIds: ["evidence-1"], interpretation: "An evidence-bound discovery.", confidence: 0.8, producedBy: "nuru.discovery.v1", status: "PROPOSED" };

function memoryRepository() {
  const rows: NuruVaultRecordRow[] = [];
  let sequence = 0n;
  const vaultModel = {
    create: async ({ data }: { data: { workspaceId: string; recordId: string; kind: string; payload: unknown } }) => {
      const row: NuruVaultRecordRow = { storageId: `stored-${sequence + 1n}`, sequence: sequence += 1n, workspaceId: data.workspaceId, recordId: data.recordId, kind: data.kind, payload: data.payload, recordedAt: new Date(createdAt) };
      rows.push(row);
      return row;
    },
    findMany: async () => rows,
  };
  const transaction = { nuruVaultRecord: vaultModel } as unknown as NuruPersistenceTransaction;
  const repository = { nuruVaultRecord: vaultModel, $transaction: async <T>(work: (tx: NuruPersistenceTransaction) => Promise<T>) => work(transaction) };
  return { adapter: new NuruVaultPersistenceAdapter("workspace-1", repository), rows };
}

describe("Nuru Vault persistence adapter", () => {
  it("persists append-only records and reconstructs canonical state from their ordered snapshots", async () => {
    const memory = memoryRepository();
    const current: CanonicalRecord = { ...envelope, id: "canonical-1", kind: "CANONICAL_RECORD", candidateId: candidate.id, governanceDecisionId: "decision-1", version: 1, status: "CURRENT" };
    const audit: VaultAuditEvent = { ...envelope, id: "audit-1", kind: "AUDIT_EVENT", eventType: "CANONICAL_PROMOTED", actor: "nuru.vault.governance.v1", resourceId: current.id, occurredAt: createdAt, reason: "Fixture promotion." };
    await memory.adapter.appendCandidate(candidate);
    await memory.adapter.appendCanonicalRecord(current);
    await memory.adapter.appendAuditEvent(audit);
    const state = await memory.adapter.readCanonicalState();

    expect(state).toMatchObject({ revision: "3", candidates: [candidate], records: [current] });
    expect(memory.rows).toHaveLength(3);
  });

  it("writes supersession as new snapshots without overwriting the prior canonical record", async () => {
    const memory = memoryRepository();
    const current: CanonicalRecord = { ...envelope, id: "canonical-1", kind: "CANONICAL_RECORD", candidateId: candidate.id, governanceDecisionId: "decision-1", version: 1, status: "CURRENT" };
    const successor: CanonicalRecord = { ...envelope, id: "canonical-2", kind: "CANONICAL_RECORD", candidateId: "candidate-2", governanceDecisionId: "decision-2", version: 2, status: "CURRENT" };
    const snapshot: CanonicalRecord = { ...current, status: "SUPERSEDED", supersededById: successor.id };
    const decision = { ...envelope, id: "decision-2", kind: "GOVERNANCE_DECISION" as const, candidateId: successor.candidateId, outcome: "APPROVED" as const, decidedBy: "human.owner", decidedAt: createdAt, rationale: "Fixture supersession.", requiredHumanReview: true, humanApprovalId: "approval-2" };
    const audit: VaultAuditEvent = { ...envelope, id: "audit-2", kind: "AUDIT_EVENT", eventType: "RECORD_SUPERSEDED", actor: "nuru.vault.governance.v1", resourceId: successor.id, occurredAt: createdAt, reason: "Fixture supersession." };
    await memory.adapter.appendCanonicalRecord(current);
    await memory.adapter.appendSupersession(decision, current, snapshot, successor, audit);
    const state = await memory.adapter.readCanonicalState();

    expect(memory.rows.map((row) => row.recordId)).toEqual([current.id, decision.id, current.id, successor.id, audit.id]);
    expect(state.records).toEqual([snapshot, successor]);
  });

  it("persists project-decision supersession as ordered immutable snapshots", async () => {
    const memory = memoryRepository();
    const current: ProjectDecision = { ...envelope, id: "project-decision-1", kind: "PROJECT_DECISION", project: "NURU", question: "Question", decision: "First decision", rationale: "Fixture", alternatives: [], candidateId: candidate.id, governanceDecisionId: "decision-1", decidedAt: createdAt, version: 1, status: "CURRENT" };
    const successor: ProjectDecision = { ...current, id: "project-decision-2", decision: "Corrected decision", version: 2 };
    const snapshot: ProjectDecision = { ...current, status: "SUPERSEDED", supersededById: successor.id };
    const audit: VaultAuditEvent = { ...envelope, id: "project-decision-audit", kind: "AUDIT_EVENT", eventType: "DECISION_RECORDED", actor: "nuru.project-memory.v1", resourceId: successor.id, occurredAt: createdAt, reason: "Fixture project decision supersession." };
    await memory.adapter.appendProjectDecision(current, undefined, audit);
    await memory.adapter.appendProjectDecision(successor, snapshot, audit);
    expect(memory.rows.map((row) => row.recordId)).toEqual([current.id, audit.id, current.id, successor.id, audit.id]);
  });
});
