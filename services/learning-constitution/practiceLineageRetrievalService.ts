import type { PracticeAuthoritativeSourceResolver, PracticeLineageRetrieval } from "../../types/learning-constitution/practiceEngine";
import type { SkillGraphProjection } from "../../types/learning-constitution/skillDependencyGraph";
import type { SkillRegistryEntry } from "../../types/learning-constitution/skillRegistry";
import { SkillGraphTraversalService } from "./skillDependencyGraphService";

/** Resolves only canonical, versioned learning inputs; missing lineage fails closed. */
export class PracticeLineageRetrievalService {
  constructor(private readonly sources: PracticeAuthoritativeSourceResolver) {}
  async retrieve(input: Readonly<{ skillId: string; graph: SkillGraphProjection; registryEntries: ReadonlyMap<string, SkillRegistryEntry>; sourceSnapshotId: string }>): Promise<PracticeLineageRetrieval> {
    const target = input.registryEntries.get(input.skillId);
    if (!target || !input.sourceSnapshotId.trim()) throw new Error("practice lineage requires a canonical target skill and source snapshot");
    const prerequisiteSkillIds = new SkillGraphTraversalService().upstream(input.skillId, input.graph.dependencies).transitive.map((entry) => entry.skillId);
    const sourceSkillIds = [input.skillId, ...prerequisiteSkillIds];
    const [knowledge, examples] = await Promise.all([Promise.all(sourceSkillIds.map((skillId) => this.sources.knowledgeIdsFor(skillId))), Promise.all(sourceSkillIds.map((skillId) => this.sources.exampleIdsFor(skillId)))]);
    const lineage = { targetSkillIds: [input.skillId], knowledgeIds: [...new Set(knowledge.flat())], procedureIds: [...new Set(sourceSkillIds.flatMap((skillId) => input.registryEntries.get(skillId)?.skill.procedureIds ?? []))], principleIds: [...new Set(sourceSkillIds.flatMap((skillId) => input.registryEntries.get(skillId)?.skill.principleIds ?? []))], exampleIds: [...new Set(examples.flat())], sourceSnapshotId: input.sourceSnapshotId };
    if (!lineage.knowledgeIds.length && !lineage.procedureIds.length && !lineage.principleIds.length && !lineage.exampleIds.length) throw new Error("practice lineage has no authoritative source material");
    return { lineage, prerequisiteSkillIds, sourceSkillIds };
  }
}
