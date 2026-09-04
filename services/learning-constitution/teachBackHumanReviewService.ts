import type { TeachBackHumanDecision, TeachBackHumanDecisionRepository } from "../../types/learning-constitution/teachBack";

export class InMemoryTeachBackHumanDecisionRepository implements TeachBackHumanDecisionRepository {
  private readonly decisions = new Map<string, TeachBackHumanDecision[]>();
  async append(decision: TeachBackHumanDecision) { const current = this.decisions.get(decision.teachBackId) ?? []; const existing = current.find((item) => item.decisionId === decision.decisionId); if (existing && JSON.stringify(existing) !== JSON.stringify(decision)) throw new Error("teach-back decision id collision"); this.decisions.set(decision.teachBackId, [...current, ...(existing ? [] : [decision])]); return existing ?? decision; }
  async list(teachBackId: string) { return [...(this.decisions.get(teachBackId) ?? [])]; }
}

/** Human feedback is immutable review evidence; corrections must create a new teaching event upstream. */
export class TeachBackHumanReviewService {
  constructor(private readonly repository: TeachBackHumanDecisionRepository) {}
  async record(decision: TeachBackHumanDecision): Promise<TeachBackHumanDecision> {
    if (decision.actor.actorType !== "HUMAN") throw new Error("teach-back review requires a human actor");
    if (!decision.note.trim()) throw new Error("teach-back review note is required");
    if (Number.isNaN(Date.parse(decision.createdAt))) throw new Error("teach-back review timestamp is invalid");
    return this.repository.append(decision);
  }
}
