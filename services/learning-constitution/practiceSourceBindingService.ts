import type { LearningAuditLedger } from "../../types/learning-constitution/learningAuditLedger";
import type { PracticeArtifactStore, PracticeAuthoritativeSourceResolver, PracticeSourceAuthorityVerifier, PracticeSourceBinding } from "../../types/learning-constitution/practiceEngine";
import type { SkillArtifactStore } from "../../types/learning-constitution/skillRegistry";

/** Binds a canonical skill to independently verified instructional source material. */
export class PracticeSourceBindingService {
  constructor(private readonly practiceArtifacts: PracticeArtifactStore, private readonly skillArtifacts: SkillArtifactStore, private readonly verifier: PracticeSourceAuthorityVerifier, private readonly audit?: LearningAuditLedger) {}
  async bind(binding: PracticeSourceBinding, workspaceId: string, correlationId: string): Promise<PracticeSourceBinding> {
    if (!binding.bindingId.trim() || !binding.skillId.trim() || !binding.sourceId.trim() || !binding.sourceSnapshotId.trim() || !binding.provenanceId.trim() || !binding.boundBy.actorId.trim()) throw new Error("practice source binding identity and provenance are required");
    if (!(await this.skillArtifacts.listArtifacts(binding.skillId)).some((artifact) => artifact.artifactType === "CANDIDATE")) throw new Error("practice source binding requires a canonical skill");
    if (!(await this.verifier.verify(binding.sourceKind, binding.sourceId))) throw new Error("practice source binding requires an approved source");
    await this.practiceArtifacts.append({ artifactId: `PRACTICE_SOURCE_BINDING:${binding.bindingId}`, artifactType: "LINEAGE_BINDING", subjectId: binding.skillId, payload: binding, createdAt: binding.boundAt });
    if (this.audit) await this.audit.append({ eventId: `audit:practice-source-bound:${binding.bindingId}`, eventType: "PRACTICE_SOURCE_BOUND", workspaceId, occurredAt: binding.boundAt, actor: binding.boundBy, correlationId, schemaVersion: "10.0", references: { provenanceIds: [binding.provenanceId] }, payload: { bindingId: binding.bindingId, skillId: binding.skillId, sourceKind: binding.sourceKind, sourceId: binding.sourceId, sourceSnapshotId: binding.sourceSnapshotId, durableKnowledgeEffect: "NONE", executionPermissionGranted: false } });
    return binding;
  }
}

/** Repository-backed resolver for the Phase 20 lineage adapter. */
export class PersistedPracticeSourceResolver implements PracticeAuthoritativeSourceResolver {
  constructor(private readonly practiceArtifacts: PracticeArtifactStore) {}
  private async bindings(skillId: string): Promise<readonly PracticeSourceBinding[]> { return (await this.practiceArtifacts.listArtifacts(skillId)).filter((artifact) => artifact.artifactType === "LINEAGE_BINDING").map((artifact) => artifact.payload as PracticeSourceBinding).filter((binding) => binding.status === "ACTIVE"); }
  async knowledgeIdsFor(skillId: string): Promise<readonly string[]> { return (await this.bindings(skillId)).filter((binding) => binding.sourceKind === "KNOWLEDGE").map((binding) => binding.sourceId); }
  async exampleIdsFor(skillId: string): Promise<readonly string[]> { return (await this.bindings(skillId)).filter((binding) => binding.sourceKind === "EXAMPLE").map((binding) => binding.sourceId); }
}
