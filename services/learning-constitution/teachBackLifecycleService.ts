import type { TeachBack, TeachBackEvaluationEvidence, TeachBackEvaluationInput, TeachBackEvaluator, TeachBackLifecycleResult, TeachBackRepository } from "../../types/learning-constitution/teachBack";

/** Immutable evidence lifecycle. It deliberately exposes no candidate or authority mutation capability. */
export class InMemoryTeachBackRepository implements TeachBackRepository {
  private readonly teachBacks = new Map<string, TeachBack>(); private readonly evaluations = new Map<string, TeachBackEvaluationEvidence[]>();
  async append(teachBack: TeachBack): Promise<TeachBack> { const existing = this.teachBacks.get(teachBack.teachBackId); if (existing && JSON.stringify(existing) !== JSON.stringify(teachBack)) throw new Error("teach-back id collision"); this.teachBacks.set(teachBack.teachBackId, existing ?? teachBack); return existing ?? teachBack; }
  async appendEvaluation(evidence: TeachBackEvaluationEvidence): Promise<TeachBackEvaluationEvidence> { const events = this.evaluations.get(evidence.teachBackId) ?? []; const existing = events.find((event) => event.evidenceId === evidence.evidenceId); if (existing && JSON.stringify(existing) !== JSON.stringify(evidence)) throw new Error("teach-back evidence id collision"); this.evaluations.set(evidence.teachBackId, [...events, ...(existing ? [] : [evidence])]); return existing ?? evidence; }
  async listByCandidateId(candidateKnowledgeId: string) { return [...this.teachBacks.values()].filter((item) => item.candidateKnowledgeId === candidateKnowledgeId); }
  async listEvaluations(teachBackId: string) { return [...(this.evaluations.get(teachBackId) ?? [])]; }
}

export class TeachBackLifecycleService {
  constructor(private readonly repository: TeachBackRepository, private readonly evaluator: TeachBackEvaluator) {}
  async evaluate(input: TeachBackEvaluationInput): Promise<TeachBackLifecycleResult> {
    const teachBack = await this.repository.append(input.teachBack);
    const evidence = await this.repository.appendEvaluation(this.evaluator.evaluate(input));
    return { teachBack, evidence, persistenceEffect: "CREATED", authorityEffect: "UNCHANGED", executionPermissionGranted: false };
  }
}
