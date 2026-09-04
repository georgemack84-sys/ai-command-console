import { CurriculumPlannerService } from "./curriculumPlannerService";
import type { Curriculum, CurriculumSkillInput } from "../../types/learning-constitution/curriculumPlanner";
import type { EpistemicState } from "../../types/learning-constitution/knowledgeGapDetection";
import type { LearningExecutionLease } from "../../types/learning-constitution/selfDirectedLearning";
import type { SkillGraphProjection } from "../../types/learning-constitution/skillDependencyGraph";
import type { SkillRegistryEntry } from "../../types/learning-constitution/skillRegistry";
import type { StrategyApprovalBridge, StrategyCurriculumMaterialization, StrategySelectionRecord } from "../../types/learning-constitution/strategySelectionEngine";
const mastery = (status: SkillRegistryEntry["status"]): CurriculumSkillInput["mastery"] => ["MASTERED", "VALIDATED", "DEMONSTRATED"].includes(status) ? "DEMONSTRATED" : status === "PROVISIONAL" ? "PROVISIONAL" : status === "DEGRADED" ? "WEAK" : "UNKNOWN";
/** Resolves only active prerequisite edges into the established Phase 27 dependency-safe planner. */
export class StrategyCurriculumMaterializerService {
  materialize(input: Readonly<{ materializationId: string; curriculumId: string; bridge: StrategyApprovalBridge; selection: StrategySelectionRecord; lease: LearningExecutionLease; goal: string; targetSkillIds: readonly string[]; graph: SkillGraphProjection; registryEntries: ReadonlyMap<string, SkillRegistryEntry>; learnerStates: ReadonlyMap<string, EpistemicState>; createdAt: string }>): Readonly<{ materialization: StrategyCurriculumMaterialization; curriculum: Curriculum }> {
    if (!input.bridge.executionAuthorized || input.bridge.selectionId !== input.selection.selectionId || input.bridge.leaseId !== input.lease.leaseId || input.lease.status !== "ACTIVE" || input.lease.proposalId !== input.bridge.learningProposalId) throw new Error("A matching approved strategy bridge and active lease are required.");
    if (!input.targetSkillIds.length || !input.goal.trim()) throw new Error("Target skills and curriculum goal are required.");
    const graphVersion = input.graph.latestVersion?.graphVersionId; if (!graphVersion) throw new Error("A versioned skill graph is required.");
    const prerequisites = new Map<string, string[]>(); for (const dependency of input.graph.dependencies.filter((item) => item.lifecycle === "ACTIVE" && item.relationshipType === "PREREQUISITE")) prerequisites.set(dependency.dependent.skillId, [...(prerequisites.get(dependency.dependent.skillId) ?? []), dependency.prerequisite.skillId]);
    const resolved = new Set<string>(); const visit = (id: string) => { if (resolved.has(id)) return; const entry = input.registryEntries.get(id); if (!entry) throw new Error(`Skill ${id} is not in the canonical registry.`); for (const prerequisite of prerequisites.get(id) ?? []) visit(prerequisite); resolved.add(id); }; input.targetSkillIds.forEach(visit);
    const skills: CurriculumSkillInput[] = [...resolved].map((skillId) => { const entry = input.registryEntries.get(skillId)!; return { skillId, prerequisites: prerequisites.get(skillId) ?? [], mastery: mastery(entry.status), epistemicState: input.learnerStates.get(skillId) ?? "UNKNOWN", evidenceIds: entry.skill.evidence.map((evidence) => evidence.evidenceId) }; });
    const curriculum = new CurriculumPlannerService().plan({ curriculumId: input.curriculumId, goal: input.goal, lease: input.lease, skills, createdAt: input.createdAt });
    return { materialization: { materializationId: input.materializationId, bridgeId: input.bridge.bridgeId, selectionId: input.selection.selectionId, graphVersionId: graphVersion, curriculumId: curriculum.curriculumId, resolvedSkillIds: skills.map((skill) => skill.skillId), createdAt: input.createdAt, immutable: true, executionAuthorized: false, authorityEffect: "UNCHANGED" }, curriculum };
  }
}
