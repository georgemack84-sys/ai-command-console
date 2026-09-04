import type { ApprovedLearningExample, ExampleSelection, ExampleUsePurpose } from "../../types/learning-constitution/exampleLibrary";
import type { KnowledgeScopeReference } from "../../types/learning-constitution/knowledgeScope";
import type { LearningAuditLedger } from "../../types/learning-constitution/learningAuditLedger";
import type { ProvenanceActor } from "../../types/learning-constitution/provenance";

const compatibleScope = (example: KnowledgeScopeReference, requested: KnowledgeScopeReference) => example.type === "GLOBAL" || example.type === "SYSTEM" || (example.type === requested.type && ("id" in example ? example.id : undefined) === ("id" in requested ? requested.id : undefined));

/** The only Phase 15 selection boundary: unapproved, mismatched, or duplicate-context examples are excluded. */
export class ExampleSelectionService {
  constructor(private readonly audit?: LearningAuditLedger) {}
  async select(input: Readonly<{ parentId: string; scope: KnowledgeScopeReference; purpose: ExampleUsePurpose; candidates: readonly ApprovedLearningExample[]; maxExamples: number; actor: ProvenanceActor; occurredAt: string }>, workspaceId: string, correlationId: string): Promise<ExampleSelection> {
    const eligible = input.candidates.filter((candidate) => candidate.status === "APPROVED" && candidate.authority === "APPROVED_EXAMPLE" && candidate.parentMutationAuthorized === false && candidate.executionPermissionGranted === false && candidate.example.parent.parentId === input.parentId && compatibleScope(candidate.example.scope, input.scope));
    const diversity = new Set<string>(); const selected: ApprovedLearningExample[] = [];
    for (const candidate of eligible) if (!diversity.has(candidate.example.diversityKey) && selected.length < input.maxExamples) { selected.push(candidate); diversity.add(candidate.example.diversityKey); }
    const result: ExampleSelection = { parentId: input.parentId, purpose: input.purpose, examples: selected, excludedCount: input.candidates.length - selected.length, diversityCount: diversity.size, persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false };
    if (this.audit) await this.audit.append({ eventId: `audit:example-selection:${correlationId}`, eventType: input.purpose === "TEACHING" ? "EXAMPLE_USED_FOR_TEACHING" : "EXAMPLE_USED_FOR_EVALUATION", workspaceId, occurredAt: input.occurredAt, actor: input.actor, correlationId, schemaVersion: "10.0", references: { provenanceIds: selected.flatMap((item) => item.example.provenanceIds) }, payload: { parentId: input.parentId, approvedExampleIds: selected.map((item) => item.approvedExampleId), excludedCount: result.excludedCount, diversityCount: result.diversityCount, executionPermissionGranted: false } });
    return result;
  }
}
