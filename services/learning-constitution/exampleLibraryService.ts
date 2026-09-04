import type { ExampleCoverage, ExampleValidation, ExampleValidationReason, ExampleValidator, LearningExample } from "../../types/learning-constitution/exampleLibrary";
import type { LearningAuditLedger } from "../../types/learning-constitution/learningAuditLedger";

const sameScope = (child: LearningExample["scope"], parent: LearningExample["parent"]["scope"]) => parent.type === "GLOBAL" || parent.type === "SYSTEM" || (child.type === parent.type && ("id" in child ? child.id : undefined) === ("id" in parent ? parent.id : undefined));

/** Security boundary for examples: evidence may illustrate a parent but may never smuggle in a rule, exception, or directive. */
export class ConservativeExampleValidator implements ExampleValidator {
  validate(example: LearningExample): ExampleValidation {
    const reasons: ExampleValidationReason[] = [];
    if (!example.parent.exists) reasons.push("PARENT_MISSING");
    if (!sameScope(example.scope, example.parent.scope)) reasons.push("PARENT_SCOPE_EXPANSION");
    if (example.introducesNewRule) reasons.push("EXAMPLE_INTRODUCES_NEW_RULE");
    if (example.introducesException) reasons.push("EXAMPLE_INTRODUCES_EXCEPTION");
    if (example.contentRole !== "ILLUSTRATIVE" && example.contentRole !== "QUOTED") reasons.push("ILLUSTRATIVE_CONTENT_REQUIRED");
    if (!example.provenanceIds.length) reasons.push("PROVENANCE_MISSING");
    const rejecting = reasons.includes("PARENT_MISSING") || reasons.includes("PROVENANCE_MISSING"); const deferring = !rejecting && reasons.length > 0;
    return { exampleId: example.exampleId, status: rejecting ? "REJECT" : deferring ? "DEFER" : "VALID", reasonCodes: reasons.length ? reasons : ["EXAMPLE_VALID"], persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false };
  }
}

export class ExampleLibraryService {
  constructor(private readonly validator: ExampleValidator, private readonly audit?: LearningAuditLedger) {}
  async assess(example: LearningExample, workspaceId: string, correlationId: string) {
    const validation = this.validator.validate(example);
    if (this.audit) await this.audit.append({ eventId: `audit:example:${example.exampleId}`, eventType: validation.status === "REJECT" ? "EXAMPLE_REJECTED" : "EXAMPLE_PROPOSED", workspaceId, occurredAt: example.createdAt, actor: example.createdBy, correlationId, schemaVersion: "10.0", references: { provenanceIds: example.provenanceIds }, payload: { exampleId: example.exampleId, parentId: example.parent.parentId, exampleType: example.exampleType, authority: example.authority, validationStatus: validation.status, executionPermissionGranted: false } });
    return validation;
  }
  coverage(parentId: string, examples: readonly LearningExample[]): ExampleCoverage {
    const attached = examples.filter((example) => example.parent.parentId === parentId); const counts = { POSITIVE: 0, NEGATIVE: 0, EDGE_CASE: 0, COUNTEREXAMPLE: 0 }; for (const example of attached) counts[example.exampleType] += 1;
    const categories = Object.values(counts).filter(Boolean).length; const coverage = categories === 0 ? "NONE" : categories === 1 ? "MINIMAL" : categories === 2 ? "PARTIAL" : categories === 3 ? "STRONG" : "COMPLETE";
    return { parentId, counts, coverage, independenceCount: new Set(attached.map((example) => example.diversityKey)).size };
  }
}
