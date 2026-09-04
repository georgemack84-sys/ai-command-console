import type { ReflectionCandidateCause, ReflectionCase, ReflectionEvidenceRef, ReflectionPrerequisiteDiagnosis } from "../../types/learning-constitution/reflectionEngine";
import type { SkillDependency } from "../../types/learning-constitution/skillDependencyGraph";
import type { SkillRegistryEntry } from "../../types/learning-constitution/skillRegistry";
import { SkillReadinessService } from "./skillDependencyGraphService";

/** Generates bounded hypotheses from collected facts; it falls back to UNKNOWN rather than narrating an unsupported cause. */
export class ReflectionCandidateCauseGenerator {
  generate(input: Readonly<{ causeId: string; reflection: ReflectionCase; evidence: readonly ReflectionEvidenceRef[]; createdAt: string }>): ReflectionCandidateCause {
    const supportingEvidenceIds = input.evidence.filter((item) => item.supports).map((item) => item.evidenceId); const contradictingEvidenceIds = input.evidence.filter((item) => !item.supports).map((item) => item.evidenceId);
    const supported = supportingEvidenceIds.length > 0 && input.reflection.failureType !== "UNKNOWN";
    const confidence = supported ? Number(Math.min(0.9, 0.45 + supportingEvidenceIds.length * 0.15 - contradictingEvidenceIds.length * 0.1).toFixed(2)) : 0;
    return { causeId: input.causeId, reflectionId: input.reflection.reflectionId, failureType: supported ? input.reflection.failureType : "UNKNOWN", location: supported ? input.reflection.failureLocation : "UNKNOWN", supportingEvidenceIds, contradictingEvidenceIds, confidence, rationale: supported ? `Candidate ${input.reflection.failureType} is supported by retained reflection evidence.` : "The available evidence does not establish a cause; request a diagnostic exercise or review.", requiredVerification: supported ? ["Verify the candidate cause with a targeted diagnostic or remediation exercise."] : ["Run a diagnostic exercise that distinguishes the competing causes."], createdBy: input.reflection.createdBy, createdAt: input.createdAt };
  }
}

/** Uses Phase 19 health to recommend the smallest weak prerequisite only when the reflection indicates a prerequisite gap. */
export class ReflectionPrerequisiteDiagnosisService {
  diagnose(input: Readonly<{ reflection: ReflectionCase; dependencies: readonly SkillDependency[]; registryEntries: ReadonlyMap<string, SkillRegistryEntry>; evidenceIds: readonly string[] }>): ReflectionPrerequisiteDiagnosis {
    if (input.reflection.failureType !== "PREREQUISITE_GAP") return { reflectionId: input.reflection.reflectionId, status: "NOT_APPLICABLE", targetSkillId: null, dependencyId: null, reason: "Reflection failure type is not a prerequisite gap.", evidenceIds: input.evidenceIds };
    const readiness = new SkillReadinessService().assess({ skillId: input.reflection.skillId, dependencies: input.dependencies, registryEntries: input.registryEntries }); const eligible = readiness.prerequisiteHealth.filter((health) => !health.satisfied && (!input.reflection.prerequisiteSkillIds.length || input.reflection.prerequisiteSkillIds.includes(health.skillId))).sort((left, right) => (left.observedMastery ?? -1) - (right.observedMastery ?? -1))[0];
    if (!eligible) return { reflectionId: input.reflection.reflectionId, status: "INSUFFICIENT_EVIDENCE", targetSkillId: null, dependencyId: null, reason: "No weak, evidenced prerequisite was found; do not blame a prerequisite without further evidence.", evidenceIds: input.evidenceIds };
    return { reflectionId: input.reflection.reflectionId, status: "RECOMMENDED", targetSkillId: eligible.skillId, dependencyId: eligible.dependencyId, reason: eligible.reason, evidenceIds: input.evidenceIds };
  }
}
