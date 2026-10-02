import { type CanonicalRecord, type CodexBuildPackage, type CodexExecutionEvent, type CodexImplementationLedger, type GovernanceDecision, type ProjectDecision, type ProjectRequirement, type VaultAuditEvent, type VaultCandidate, type VaultRecord, vaultRecordSchema } from "@/src/nuru/vault-contracts";
import { type VaultCandidateAdmissionStore } from "@/src/server/services/nuru-vault-candidate-admission-service";
import { type VaultCanonicalStore } from "@/src/server/services/nuru-vault-canonical-promotion-service";
import { type VaultCanonicalReadStore } from "@/src/server/services/nuru-vault-canonical-projection-service";
import { nuruKnowledgeRepository, type NuruPersistenceTransaction, type NuruVaultRecordRow } from "@/src/server/repositories/nuru-knowledge-repository";

type VaultRepository = Pick<NuruPersistenceTransaction, "nuruVaultRecord"> & {
  $transaction: <T>(fn: (tx: NuruPersistenceTransaction) => Promise<T>) => Promise<T>;
};

function dataFor(workspaceId: string, record: VaultRecord) {
  return {
    workspaceId,
    recordId: record.id,
    kind: record.kind,
    schemaVersion: record.schemaVersion,
    classification: record.classification,
    correlationId: record.correlationId,
    payload: record,
  };
}

/**
 * Prisma adapter for the narrow Vault ports. It persists append-only snapshots;
 * the logical record ID is intentionally not the database primary key.
 */
export class NuruVaultPersistenceAdapter implements VaultCandidateAdmissionStore, VaultCanonicalStore, VaultCanonicalReadStore {
  constructor(private readonly workspaceId: string, private readonly repository: VaultRepository = nuruKnowledgeRepository) {}

  private async append(record: VaultRecord, transaction: Pick<NuruPersistenceTransaction, "nuruVaultRecord"> = this.repository) {
    await transaction.nuruVaultRecord.create({ data: dataFor(this.workspaceId, record) });
  }

  async appendRecord(record: VaultRecord) {
    await this.append(vaultRecordSchema.parse(record));
  }

  async appendCandidate(candidate: VaultCandidate) {
    await this.append(vaultRecordSchema.parse(candidate));
  }

  async appendCanonicalRecord(record: CanonicalRecord) {
    await this.append(vaultRecordSchema.parse(record));
  }

  async appendAuditEvent(event: VaultAuditEvent) {
    await this.append(vaultRecordSchema.parse(event));
  }

  async appendPromotion(decision: GovernanceDecision, record: CanonicalRecord, auditEvent: VaultAuditEvent) {
    await this.repository.$transaction(async (transaction) => {
      await this.append(vaultRecordSchema.parse(decision), transaction);
      await this.append(vaultRecordSchema.parse(record), transaction);
      await this.append(vaultRecordSchema.parse(auditEvent), transaction);
    });
  }

  async appendSupersession(decision: GovernanceDecision, previous: CanonicalRecord, supersededSnapshot: CanonicalRecord, successor: CanonicalRecord, auditEvent: VaultAuditEvent) {
    if (previous.id !== supersededSnapshot.id || successor.id === previous.id) {
      throw new Error("Invalid immutable supersession snapshot.");
    }
    await this.repository.$transaction(async (transaction) => {
      await this.append(vaultRecordSchema.parse(decision), transaction);
      await this.append(vaultRecordSchema.parse(supersededSnapshot), transaction);
      await this.append(vaultRecordSchema.parse(successor), transaction);
      await this.append(vaultRecordSchema.parse(auditEvent), transaction);
    });
  }

  async appendProjectDecision(record: ProjectDecision, supersededSnapshot: ProjectDecision | undefined, auditEvent: VaultAuditEvent) {
    if (supersededSnapshot && (supersededSnapshot.id === record.id || supersededSnapshot.supersededById !== record.id)) throw new Error("Invalid immutable project-decision supersession snapshot.");
    await this.repository.$transaction(async (transaction) => {
      if (supersededSnapshot) await this.append(vaultRecordSchema.parse(supersededSnapshot), transaction);
      await this.append(vaultRecordSchema.parse(record), transaction);
      await this.append(vaultRecordSchema.parse(auditEvent), transaction);
    });
  }

  async appendProjectRequirement(record: ProjectRequirement, supersededSnapshot: ProjectRequirement | undefined, auditEvent: VaultAuditEvent) {
    if (supersededSnapshot && (supersededSnapshot.id === record.id || supersededSnapshot.supersededById !== record.id)) throw new Error("Invalid immutable project-requirement supersession snapshot.");
    await this.repository.$transaction(async (transaction) => {
      if (supersededSnapshot) await this.append(vaultRecordSchema.parse(supersededSnapshot), transaction);
      await this.append(vaultRecordSchema.parse(record), transaction);
      await this.append(vaultRecordSchema.parse(auditEvent), transaction);
    });
  }

  async appendBuildPackage(record: CodexBuildPackage, auditEvent: VaultAuditEvent) {
    await this.repository.$transaction(async (transaction) => { await this.append(vaultRecordSchema.parse(record), transaction); await this.append(vaultRecordSchema.parse(auditEvent), transaction); });
  }

  async appendImplementationLedger(record: CodexImplementationLedger, auditEvent: VaultAuditEvent) { await this.repository.$transaction(async (transaction) => { await this.append(vaultRecordSchema.parse(record), transaction); await this.append(vaultRecordSchema.parse(auditEvent), transaction); }); }
  async appendExecutionEvent(record: CodexExecutionEvent) { await this.append(vaultRecordSchema.parse(record)); }

  /** Returns the immutable Vault ledger in append order for evidence-aware views. */
  async readVaultRecords(): Promise<VaultRecord[]> {
    const rows = await this.repository.nuruVaultRecord.findMany({
      where: { workspaceId: this.workspaceId },
      orderBy: { sequence: "asc" },
    });
    return rows.map((row) => vaultRecordSchema.parse(row.payload));
  }

  async readCanonicalState(): Promise<{ revision: string; records: CanonicalRecord[]; candidates: VaultCandidate[] }> {
    const rows = await this.repository.nuruVaultRecord.findMany({
      where: { workspaceId: this.workspaceId },
      orderBy: { sequence: "asc" },
    });
    const latestCandidates = new Map<string, VaultCandidate>();
    const latestRecords = new Map<string, CanonicalRecord>();
    for (const row of rows) {
      const record = vaultRecordSchema.parse(row.payload);
      if (record.kind === "CANDIDATE") latestCandidates.set(record.id, record);
      if (record.kind === "CANONICAL_RECORD") latestRecords.set(record.id, record);
    }
    return {
      revision: rows.length ? String((rows.at(-1) as NuruVaultRecordRow).sequence) : "0",
      records: [...latestRecords.values()],
      candidates: [...latestCandidates.values()],
    };
  }
}
