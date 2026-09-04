import { assessConstitutionalAdmission } from "../../types/learning-constitution/constitutionalAdmission";
import type { AuthorityGateResult } from "../../types/learning-constitution/authorityEnforcement";
import type { ConflictDetectionResult } from "../../types/learning-constitution/conflictDetection";
import type { DeferredCandidateReevaluationInput } from "../../types/learning-constitution/deferredCandidateLifecycle";
import type { DeferredCandidateReevaluationInputProvider, DeferredCandidateResolutionEvent } from "../../types/learning-constitution/deferredCandidateResolution";
import type { InformationClassifier, InformationClassificationResult, ClassificationProvenance } from "../../types/learning-constitution/informationClassification";
import type { KnowledgeScopeResolver } from "../../types/learning-constitution/knowledgeScope";
import type { KnowledgeValidator } from "../../types/learning-constitution/knowledgeValidation";
import type { LearningDecisionEngine } from "../../types/learning-constitution/learningDecision";
import type { CandidateKnowledgeRecord, HumanApproval, ProvenanceLedger, TeachingEvent } from "../../types/learning-constitution/provenance";
import { ConflictAdmissionGate } from "./conflictAdmissionGate";

type SourceMappedType = ClassificationProvenance["sourceType"];
const sourceTypes: Readonly<Record<TeachingEvent["sourceType"], SourceMappedType>> = {
  HUMAN_ENTRY: "OPERATOR_STATEMENT",
  CONVERSATION: "CONVERSATION",
  DOCUMENT: "DOCUMENT",
  APPROVED_REFERENCE: "DOCUMENT",
  EXTERNAL_SOURCE: "EXTERNAL_SOURCE",
  SYSTEM_EVENT: "SYSTEM_CONFIGURATION",
  AGENT_OUTPUT: "AGENT_OUTPUT",
  OBSERVATION: "TOOL_RESULT",
  IMPORT: "DOCUMENT",
};
const sourceType = (source: TeachingEvent): SourceMappedType => sourceTypes[source.sourceType];

const validationStatus = (outcome: string): "VALID" | "INVALID" | "REQUIRES_VALIDATION" =>
  outcome === "VALID" ? "VALID" : outcome === "INVALID" || outcome === "QUARANTINED" ? "INVALID" : "REQUIRES_VALIDATION";

/**
 * Reconstructs a new gate/admission input from immutable Phase 7 lineage. It
 * never accepts candidate, source, scope, or approval facts from the client.
 */
export class ProvenanceReevaluationInputProvider implements DeferredCandidateReevaluationInputProvider {
  constructor(private readonly dependencies: Readonly<{
    ledger: ProvenanceLedger;
    classifier: InformationClassifier;
    scopeResolver: KnowledgeScopeResolver;
    authorityEvaluator(input: Readonly<{ candidate: CandidateKnowledgeRecord; classification: InformationClassificationResult; scope: Awaited<ReturnType<KnowledgeScopeResolver["resolve"]>>; provenance: ClassificationProvenance; resolution: DeferredCandidateResolutionEvent }>): Promise<AuthorityGateResult>;
    conflictEvaluator(input: Readonly<{ candidate: CandidateKnowledgeRecord; classification: InformationClassificationResult; scope: Awaited<ReturnType<KnowledgeScopeResolver["resolve"]>>; provenance: ClassificationProvenance }>): Promise<ConflictDetectionResult>;
    validator: KnowledgeValidator;
    decisionEngine: LearningDecisionEngine;
    resolveIntent(input: Readonly<{ candidate: CandidateKnowledgeRecord; source: TeachingEvent; resolution: DeferredCandidateResolutionEvent }>): "EXPLICIT" | "APPROVED" | "IMPLICIT" | "NONE" | "UNKNOWN";
    versions: Readonly<{ gateVersion: string; constitutionVersion: string; taxonomyVersion: string; authorityPolicyVersion: string; validationPolicyVersion: string; conflictEngineVersion: string }>;
    registryVersion(): Promise<string>;
    teachBack?: Readonly<{ requirement(classification: CandidateKnowledgeRecord["classification"], scope: CandidateKnowledgeRecord["scope"]): "NOT_REQUIRED" | "OPTIONAL" | "REQUIRED"; latestOutcome(candidateId: string): Promise<"PASS" | "PASS_WITH_UNCERTAINTY" | "PARTIAL" | "CLARIFICATION_REQUIRED" | "FAIL" | undefined> }>;
  }>) {}

  async build(input: Readonly<{ candidate: import("../../types/learning-constitution/deferredCandidateLifecycle").DeferredCandidateRecord; resolution: DeferredCandidateResolutionEvent }>): Promise<DeferredCandidateReevaluationInput> {
    const candidate = await this.requireCandidate(input.candidate.candidateId);
    const source = await this.requireSource(candidate);
    const provenance: ClassificationProvenance = {
      observationId: `teaching:${source.id}`,
      sourceId: source.id,
      sourceType: sourceType(source),
      originatingActorId: source.sourceActor.actorId,
      observedAt: source.receivedAt,
    };
    const classification = await this.dependencies.classifier.classify({ content: candidate.statement, provenance, scopeHint: candidate.scope.type });
    const scope = await this.dependencies.scopeResolver.resolve({ content: candidate.statement, classification, knownScopes: [candidate.scope], activeScopes: [candidate.scope], explicitScope: candidate.scope });
    const [authority, conflictDetection] = await Promise.all([
      this.dependencies.authorityEvaluator({ candidate, classification, scope, provenance, resolution: input.resolution }),
      this.dependencies.conflictEvaluator({ candidate, classification, scope, provenance }),
    ]);
    const conflict = await new ConflictAdmissionGate(this.dependencies.ledger).evaluate(candidate.id);
    const evidence = await this.collectEvidence(candidate, provenance);
    const validation = await this.dependencies.validator.validate({ candidateId: candidate.id, classification, scopeResolution: scope, conflictDetection, provenance, evidence, authorityVerified: authority.decision === "ALLOW" });
    const approvals = (await this.dependencies.ledger.getAll()).filter((record): record is HumanApproval => record.recordType === "HUMAN_APPROVAL" && record.candidateId === candidate.id && record.decision === "APPROVED");
    const approvalRequired = validation.outcome === "REQUIRES_APPROVAL";
    const approval = approvalRequired
      ? approvals.length ? { approvalRequired: true, status: "APPROVED" as const, approvalId: approvals[0]!.id, approvedBy: approvals[0]!.actor.actorId, approvedAt: approvals[0]!.decidedAt, approvalScope: candidate.scope } : { approvalRequired: true, status: "PENDING" as const }
      : { approvalRequired: false, status: "NOT_REQUIRED" as const };
    const decision = await this.dependencies.decisionEngine.decide({ candidateId: candidate.id, classification, scopeResolution: scope, conflictDetection, validation, provenance, approval, policy: { policyVersion: this.dependencies.versions.validationPolicyVersion, constitutionVersion: this.dependencies.versions.constitutionVersion } });
    const constitution = assessConstitutionalAdmission({ candidateCreated: true, classification: classification.classification, scope: scope.scope?.type, conflictDetectionCompleted: true, conflictRelationship: conflictDetection.relationship, validationStatus: validationStatus(validation.outcome), approvalRequired, approved: approvals.length > 0, provenanceComplete: true, provenanceReconstructable: true });
    const [registryVersion, teachBackOutcome] = await Promise.all([this.dependencies.registryVersion(), this.dependencies.teachBack?.latestOutcome(candidate.id)]);
    const teachBackRequirement = this.dependencies.teachBack?.requirement(candidate.classification, candidate.scope);
    return {
      gateRequest: {
        evaluationId: `reevaluation:${input.resolution.eventId}`,
        candidate: { candidateId: candidate.id, content: candidate.statement, classification: candidate.classification, provenance },
        classification,
        scope,
        authority,
        conflict,
        validation,
        constitution,
        context: { ...this.dependencies.versions, registryVersion, learningIntent: this.dependencies.resolveIntent({ candidate, source, resolution: input.resolution }), decisionActorId: input.resolution.actorId, ...(teachBackRequirement ? { teachBack: { requirement: teachBackRequirement, ...(teachBackOutcome ? { outcome: teachBackOutcome } : {}) } } : {}) },
      },
      admission: { candidate: { candidateId: candidate.id, content: candidate.statement, classification: candidate.classification, provenance }, classification, scopeResolution: scope, conflictDetection, validation, decision },
    };
  }

  private async requireCandidate(candidateId: string): Promise<CandidateKnowledgeRecord> {
    const record = await this.dependencies.ledger.get(candidateId);
    if (!record || record.recordType !== "CANDIDATE_KNOWLEDGE") throw new Error("deferred candidate provenance is unavailable");
    return record;
  }

  private async requireSource(candidate: CandidateKnowledgeRecord): Promise<TeachingEvent> {
    for (const extractionId of candidate.extractionRefs) {
      const extraction = await this.dependencies.ledger.get(extractionId);
      if (!extraction || extraction.recordType !== "EXTRACTION") continue;
      for (const sourceId of extraction.sourceRefs) {
        const source = await this.dependencies.ledger.get(sourceId);
        if (source?.recordType === "TEACHING_EVENT") return source;
      }
    }
    throw new Error("deferred candidate source provenance is unavailable");
  }

  private async collectEvidence(candidate: CandidateKnowledgeRecord, provenance: ClassificationProvenance) {
    const records = await Promise.all(candidate.evidenceRefs.map((id) => this.dependencies.ledger.get(id)));
    return records.flatMap((record, index) => record ? [{ evidenceId: candidate.evidenceRefs[index]!, type: "AGENT_OUTPUT" as const, sourceReference: candidate.evidenceRefs[index]!, observedAt: provenance.observedAt, provenance, supportsCandidate: false }] : []);
  }
}
