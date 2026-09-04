import type { EvidenceSet, EvidenceSetRequest, EvidenceSetResult, ProvenanceLedger } from "../../types/learning-constitution/provenance";

type Dependencies = Readonly<{ ledger: ProvenanceLedger; now?: () => string; createId?: () => string }>;
const result = (values: Omit<EvidenceSetResult, "authorityEffect" | "executionPermissionGranted">): EvidenceSetResult => ({ ...values, authorityEffect: "UNCHANGED", executionPermissionGranted: false });

/** Captures supporting records without interpreting them or granting authority. */
export class EvidenceSetService {
  private readonly now: () => string;
  private readonly createId: () => string;
  constructor(private readonly dependencies: Dependencies) { this.now = dependencies.now ?? (() => new Date().toISOString()); this.createId = dependencies.createId ?? (() => `ES-${crypto.randomUUID()}`); }

  async create(request: EvidenceSetRequest): Promise<EvidenceSetResult> {
    if (!request.collectedBy.actorId.trim()) return result({ status: "REJECTED", reasonCode: "COLLECTOR_UNKNOWN", created: false, persistenceEffect: "NONE" });
    if (!request.evidenceRefs.length || (await Promise.all(request.evidenceRefs.map((id) => this.dependencies.ledger.get(id)))).some((record) => !record)) return result({ status: "REJECTED", reasonCode: "EVIDENCE_MISSING", created: false, persistenceEffect: "NONE" });
    const evidenceSet: EvidenceSet = { id: this.createId(), recordType: "EVIDENCE_SET", evidenceRefs: [...request.evidenceRefs], collectedBy: request.collectedBy, createdAt: request.createdAt ?? this.now(), immutable: true };
    try { await this.dependencies.ledger.append(evidenceSet); return result({ status: "CREATED", reasonCode: "EVIDENCE_SET_CREATED", evidenceSet, created: true, persistenceEffect: "CREATED" }); }
    catch { return result({ status: "PERSISTENCE_FAILED", reasonCode: "PERSISTENCE_FAILED", created: false, persistenceEffect: "NONE" }); }
  }
}
