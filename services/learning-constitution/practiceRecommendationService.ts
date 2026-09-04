import type { PracticeEvidence, PracticeRecommendation, PracticeRegressionDue, PracticeTransferLevel } from "../../types/learning-constitution/practiceEngine";
import type { SkillDependency } from "../../types/learning-constitution/skillDependencyGraph";
import type { SkillRegistryEntry } from "../../types/learning-constitution/skillRegistry";
import { SkillReadinessService } from "./skillDependencyGraphService";

const ladder: readonly PracticeTransferLevel[] = ["EXACT", "MODIFIED", "NOVEL", "AMBIGUOUS", "EDGE", "ADVERSARIAL"];
const isoAfterDays = (date: string, days: number) => new Date(new Date(date).getTime() + days * 86_400_000).toISOString();

/** Chooses a conservative next challenge; this service recommends practice and never changes mastery. */
export class PracticeRecommendationService {
  recommend(input: Readonly<{ skillId: string; dependencies: readonly SkillDependency[]; registryEntries: ReadonlyMap<string, SkillRegistryEntry>; evidence: readonly PracticeEvidence[] }>): PracticeRecommendation {
    const readiness = new SkillReadinessService().assess({ skillId: input.skillId, dependencies: input.dependencies, registryEntries: input.registryEntries });
    const weak = readiness.prerequisiteHealth.filter((health) => !health.satisfied).sort((left, right) => (left.observedMastery ?? -1) - (right.observedMastery ?? -1))[0];
    if (weak) return { skillId: input.skillId, recommendedSkillId: weak.skillId, transferLevel: "EXACT", reason: `Remediate ${weak.skillId}: ${weak.reason}`, source: "PREREQUISITE_REMEDIATION" };
    const attempted = new Set(input.evidence.filter((item) => item.skillId === input.skillId && (item.outcome === "PASS" || item.outcome === "CLARIFICATION_VALID")).map((item) => item.transferLevel));
    return { skillId: input.skillId, recommendedSkillId: input.skillId, transferLevel: ladder.find((level) => !attempted.has(level)) ?? "ADVERSARIAL", reason: attempted.size ? "Advance to the next uncorroborated transfer level." : "Begin with an exact exercise to establish comprehension evidence.", source: "TRANSFER_PROGRESS" };
  }
}

/** Identifies established capabilities due for regression practice without declaring them stale or invalid. */
export class PracticeRegressionScheduler {
  due(input: Readonly<{ registryEntries: readonly SkillRegistryEntry[]; evidence: readonly PracticeEvidence[]; now: string; intervalDays?: number }>): readonly PracticeRegressionDue[] {
    const intervalDays = input.intervalDays ?? 30;
    return input.registryEntries.filter((entry) => entry.status === "VALIDATED" || entry.status === "MASTERED").flatMap((entry) => {
      const lastPracticedAt = input.evidence.filter((item) => item.skillId === entry.skill.skillId).map((item) => item.createdAt).sort().at(-1) ?? null;
      const dueAt = lastPracticedAt ? isoAfterDays(lastPracticedAt, intervalDays) : input.now;
      return new Date(dueAt).getTime() <= new Date(input.now).getTime() ? [{ skillId: entry.skill.skillId, dueAt, lastPracticedAt, reason: lastPracticedAt ? `No practice evidence in ${intervalDays} days.` : "No recorded practice evidence for an established skill." }] : [];
    });
  }
}
