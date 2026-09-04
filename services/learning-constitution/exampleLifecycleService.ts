import type { ExampleArtifactStore, ExampleLifecycleDecision } from "../../types/learning-constitution/exampleLibrary";
import type { LearningAuditLedger } from "../../types/learning-constitution/learningAuditLedger";

/** Retires illustrative evidence by adding a decision record; original examples remain immutable and inspectable. */
export class ExampleLifecycleService {
  constructor(private readonly artifacts: ExampleArtifactStore, private readonly audit?: LearningAuditLedger) {}
  async record(decision: ExampleLifecycleDecision, workspaceId: string, correlationId: string): Promise<Readonly<{ decision: ExampleLifecycleDecision; persistenceEffect: "CREATED"; authorityEffect: "UNCHANGED"; executionPermissionGranted: false }>> {
    if (decision.actor.actorType !== "HUMAN" || !decision.actor.actorId.trim()) throw new Error("example lifecycle decision requires a human actor");
    if (!decision.reason.trim()) throw new Error("example lifecycle decision requires a reason");
    if (decision.action === "SUPERSEDE" && !decision.replacementExampleId?.trim()) throw new Error("example supersession requires a replacement");
    await this.artifacts.append({ artifactId: `EXAMPLE_${decision.action}:${decision.decisionId}`, artifactType: decision.action === "INVALIDATE" ? "INVALIDATION" : "SUPERSESSION", subjectId: decision.exampleId, payload: decision, createdAt: decision.decidedAt });
    if (this.audit) await this.audit.append({ eventId: `audit:example-lifecycle:${decision.decisionId}`, eventType: decision.action === "INVALIDATE" ? "EXAMPLE_INVALIDATED" : "EXAMPLE_SUPERSEDED", workspaceId, occurredAt: decision.decidedAt, actor: decision.actor, correlationId, schemaVersion: "10.0", references: {}, payload: { exampleId: decision.exampleId, replacementExampleId: decision.replacementExampleId, parentMutationAuthorized: false, executionPermissionGranted: false } });
    return { decision, persistenceEffect: "CREATED", authorityEffect: "UNCHANGED", executionPermissionGranted: false };
  }
}
