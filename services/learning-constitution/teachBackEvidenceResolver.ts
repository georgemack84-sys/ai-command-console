import type { TeachBackRepository } from "../../types/learning-constitution/teachBack";

/** Returns only the latest evaluation disposition; generated teach-back text never crosses this boundary. */
export class TeachBackEvidenceResolver {
  constructor(private readonly repository: TeachBackRepository) {}
  async latestOutcome(candidateKnowledgeId: string) {
    const attempts = await this.repository.listByCandidateId(candidateKnowledgeId);
    const evaluations = (await Promise.all(attempts.map((attempt) => this.repository.listEvaluations(attempt.teachBackId)))).flat();
    return [...evaluations].sort((left, right) => right.createdAt.localeCompare(left.createdAt) || right.evidenceId.localeCompare(left.evidenceId))[0]?.outcome;
  }
}
