import type { DeferredCandidateRecord, DeferredCandidateReevaluationInput, DeferredCandidateReevaluationResult, DeferredCandidateRegistry } from "../../types/learning-constitution/deferredCandidateLifecycle";
import type { GateDecision } from "../../types/learning-constitution/durableLearningGate";

type PromotionService = Readonly<{
  promote(input: DeferredCandidateReevaluationInput): Promise<Readonly<{
    status: "COMMITTED" | "DEFERRED" | "REJECTED" | "RE_EVALUATION_REQUIRED";
    gateDecision: GateDecision;
    persistenceEffect: "CREATED" | "NONE";
  }>>;
}>;

/** Deferred candidates are re-evaluated from inputs; they cannot be promoted by state transition. */
export class DeferredCandidateLifecycleService {
  constructor(private readonly dependencies: Readonly<{
    registry: DeferredCandidateRegistry;
    promotion: PromotionService;
    now?: () => string;
  }>) {}

  async defer(decision: GateDecision): Promise<DeferredCandidateRecord | undefined> {
    if (decision.outcome !== "DEFER") return undefined;
    const now = (this.dependencies.now ?? (() => new Date().toISOString()))();
    return this.dependencies.registry.upsert({
      deferredCandidateId: `deferred:${decision.candidateId}`,
      candidateId: decision.candidateId,
      lastEvaluationId: decision.evaluationId,
      reasonCodes: decision.reasonCodes,
      status: "PENDING",
      createdAt: now,
      updatedAt: now,
    });
  }

  async reevaluate(deferredCandidateId: string, input: DeferredCandidateReevaluationInput): Promise<DeferredCandidateReevaluationResult> {
    const current = await this.dependencies.registry.get(deferredCandidateId);
    if (!current) return this.result("NOT_FOUND");
    if (current.candidateId !== input.gateRequest.candidate.candidateId) return this.result("CANDIDATE_MISMATCH");

    const promotion = await this.dependencies.promotion.promote(input);
    const status = promotion.status === "DEFERRED" ? "PENDING" : promotion.status;
    const updated = await this.dependencies.registry.upsert({
      ...current,
      lastEvaluationId: promotion.gateDecision.evaluationId,
      reasonCodes: promotion.gateDecision.reasonCodes,
      status,
      updatedAt: (this.dependencies.now ?? (() => new Date().toISOString()))(),
    });
    return {
      status,
      record: updated,
      gateDecision: promotion.gateDecision,
      persistenceEffect: promotion.persistenceEffect,
      authorityEffect: "UNCHANGED",
      executionPermissionGranted: false,
    };
  }

  private result(status: "NOT_FOUND" | "CANDIDATE_MISMATCH"): DeferredCandidateReevaluationResult {
    return { status, persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false };
  }
}

export class InMemoryDeferredCandidateRegistry implements DeferredCandidateRegistry {
  private readonly records = new Map<string, DeferredCandidateRecord>();
  async upsert(record: DeferredCandidateRecord): Promise<DeferredCandidateRecord> {
    const existing = this.records.get(record.deferredCandidateId);
    const persisted = existing ? { ...record, createdAt: existing.createdAt } : record;
    this.records.set(record.deferredCandidateId, persisted);
    return persisted;
  }
  async get(deferredCandidateId: string): Promise<DeferredCandidateRecord | undefined> {
    return this.records.get(deferredCandidateId);
  }
  async list(status?: DeferredCandidateRecord["status"]): Promise<readonly DeferredCandidateRecord[]> {
    return [...this.records.values()]
      .filter((record) => !status || record.status === status)
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt) || left.deferredCandidateId.localeCompare(right.deferredCandidateId));
  }
}
