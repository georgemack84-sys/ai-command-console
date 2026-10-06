import { describe, expect, it } from "vitest";
import {
  type CanonicalRecord,
  type GovernanceDecision,
  type VaultAuditEvent,
  type VaultCandidate,
  vaultSchemaVersion,
} from "@/src/nuru/vault-contracts";
import {
  NuruVaultCanonicalPromotionService,
  type VaultCanonicalStore,
} from "@/src/server/services/nuru-vault-canonical-promotion-service";
import {
  NuruVaultCanonicalProjectionService,
  type VaultCanonicalReadStore,
} from "@/src/server/services/nuru-vault-canonical-projection-service";

const envelope = {
  schemaVersion: vaultSchemaVersion,
  classification: "PUBLIC" as const,
  correlationId: "b51c0ab0-7ef8-4d6a-92e9-3176f2d8c409",
};

function candidate(id: string, interpretation: string, createdAt: string): VaultCandidate {
  return {
    ...envelope,
    id,
    kind: "CANDIDATE",
    createdAt,
    evidenceIds: [`evidence:${id}`],
    interpretation,
    confidence: 0.95,
    producedBy: "nuru.discovery.v1",
    status: "PROPOSED",
  };
}

function decision(id: string, candidateId: string, decidedAt: string): GovernanceDecision {
  return {
    ...envelope,
    id,
    kind: "GOVERNANCE_DECISION",
    createdAt: decidedAt,
    candidateId,
    outcome: "APPROVED",
    decidedBy: "nuru.governance.v1",
    decidedAt,
    rationale: "Primary-source evidence and human review approved this temporal update.",
    requiredHumanReview: true,
    humanApprovalId: `approval:${id}`,
  };
}

function memoryVault(initialCandidates: VaultCandidate[]) {
  const records: CanonicalRecord[] = [];
  const audits: VaultAuditEvent[] = [];
  const decisions: GovernanceDecision[] = [];

  const store: VaultCanonicalStore & VaultCanonicalReadStore = {
    appendPromotion: async (approvedDecision, record, audit) => {
      decisions.push(approvedDecision);
      records.push(record);
      audits.push(audit);
    },
    appendSupersession: async (approvedDecision, _previous, supersededSnapshot, successor, audit) => {
      decisions.push(approvedDecision);
      records.push(supersededSnapshot, successor);
      audits.push(audit);
    },
    readCanonicalState: async () => {
      const latest = new Map<string, CanonicalRecord>();
      for (const record of records) latest.set(record.id, record);
      return {
        revision: String(records.length + decisions.length + audits.length),
        records: [...latest.values()],
        candidates: initialCandidates,
      };
    },
  };

  return { store, records, audits };
}

describe("NRQ-09 knowledge evolution qualification", () => {
  it("preserves the former fact, retains a supersession snapshot, and exposes only the approved successor as current", async () => {
    const former = candidate("candidate-ceo-2025", "Company CEO is Person A through 2025.", "2025-01-01T00:00:00.000Z");
    const successorCandidate = candidate("candidate-ceo-2026", "Company appointed Person B as CEO beginning in 2026.", "2026-01-01T00:00:00.000Z");
    const vault = memoryVault([former, successorCandidate]);

    const original = await NuruVaultCanonicalPromotionService.promote({
      candidate: former,
      decision: decision("decision-ceo-2025", former.id, former.createdAt),
      canonicalRecordId: "canonical-ceo-2025",
    }, vault.store);

    const update = await NuruVaultCanonicalPromotionService.supersede({
      candidate: successorCandidate,
      decision: decision("decision-ceo-2026", successorCandidate.id, successorCandidate.createdAt),
      currentRecord: original.record,
      canonicalRecordId: "canonical-ceo-2026",
    }, vault.store);

    expect(original.record).toMatchObject({ id: "canonical-ceo-2025", status: "CURRENT", version: 1 });
    expect(update.supersededRecord).toMatchObject({
      id: original.record.id,
      status: "SUPERSEDED",
      supersededById: update.successor.id,
      version: 1,
    });
    expect(update.successor).toMatchObject({ id: "canonical-ceo-2026", status: "CURRENT", version: 2 });
    expect(vault.records).toEqual([original.record, update.supersededRecord, update.successor]);
    expect(vault.audits).toHaveLength(2);

    const projection = await NuruVaultCanonicalProjectionService.rebuild(vault.store);
    expect(projection.entries).toEqual([
      expect.objectContaining({
        canonicalRecordId: "canonical-ceo-2026",
        candidateId: successorCandidate.id,
        version: 2,
        interpretation: successorCandidate.interpretation,
      }),
    ]);
  });
});
