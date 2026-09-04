import type { ExampleArtifactStore, ExampleValidation, ExampleValidator, LearningExample } from "../../types/learning-constitution/exampleLibrary";
import type { LearningAuditLedger } from "../../types/learning-constitution/learningAuditLedger";

/** Persists a submitted example and its validation as separate immutable evidence records. */
export class ExampleCandidateService {
  constructor(private readonly validator: ExampleValidator, private readonly artifacts: ExampleArtifactStore, private readonly audit?: LearningAuditLedger) {}
  async submit(candidate: LearningExample, workspaceId: string, correlationId: string): Promise<Readonly<{ candidate: LearningExample; validation: ExampleValidation; persistenceEffect: "CREATED"; authorityEffect: "UNCHANGED"; executionPermissionGranted: false }>> {
    const validation = this.validator.validate(candidate);
    await this.artifacts.append({ artifactId: `EXAMPLE_CANDIDATE:${candidate.exampleId}`, artifactType: "CANDIDATE", subjectId: candidate.exampleId, payload: candidate, createdAt: candidate.createdAt });
    await this.artifacts.append({ artifactId: `EXAMPLE_VALIDATION:${candidate.exampleId}:${correlationId}`, artifactType: "VALIDATION", subjectId: candidate.exampleId, payload: validation, createdAt: candidate.createdAt });
    if (this.audit) await this.audit.append({ eventId: `audit:example-candidate:${candidate.exampleId}:${correlationId}`, eventType: validation.status === "REJECT" ? "EXAMPLE_REJECTED" : "EXAMPLE_PROPOSED", workspaceId, occurredAt: candidate.createdAt, actor: candidate.createdBy, correlationId, schemaVersion: "10.0", references: { provenanceIds: candidate.provenanceIds }, payload: { exampleId: candidate.exampleId, parentId: candidate.parent.parentId, validationStatus: validation.status, executionPermissionGranted: false } });
    return { candidate, validation, persistenceEffect: "CREATED", authorityEffect: "UNCHANGED", executionPermissionGranted: false };
  }
}
