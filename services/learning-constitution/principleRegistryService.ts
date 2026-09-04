import type { DurablePrinciple, HumanAuthorizedPrinciple, PrincipleApplicationEvaluation, PrincipleApplicationRequest, PrincipleReassessmentRepository, PrincipleReassessmentResult, PrincipleReassessmentTrigger, PrincipleRegistry } from "../../types/learning-constitution/principleLearning";
import type { LearningAuditLedger } from "../../types/learning-constitution/learningAuditLedger";
import { canonicalizeAuditValue } from "./auditIntegrityHash";

const scopeMatches = (principle: DurablePrinciple["scope"], requested: PrincipleApplicationRequest["scope"]) => principle.type === "GLOBAL" || principle.type === "SYSTEM" || (principle.type === requested.type && ("id" in principle ? principle.id : undefined) === ("id" in requested ? requested.id : undefined));

export class InMemoryPrincipleRegistry implements PrincipleRegistry {
  private readonly entries = new Map<string, DurablePrinciple>();
  async append(principle: DurablePrinciple): Promise<DurablePrinciple> { const existing = this.entries.get(principle.principleId); if (existing && canonicalizeAuditValue(existing) !== canonicalizeAuditValue(principle)) throw new Error("durable principle id collision"); this.entries.set(principle.principleId, existing ?? principle); return existing ?? principle; }
  async list() { return [...this.entries.values()]; }
}

/** Registry admission requires a completed Phase 9 durable record; direct insertion of observations is impossible. */
export class PrincipleRegistryService {
  constructor(private readonly registry: PrincipleRegistry, private readonly audit?: LearningAuditLedger) {}
  async register(input: Readonly<{ principleId: string; durableKnowledgeId: string; interpretation: HumanAuthorizedPrinciple; provenanceIds: readonly string[]; teachBackOutcome: "PASS" | "PASS_WITH_UNCERTAINTY" | "PARTIAL" | "CLARIFICATION_REQUIRED" | "FAIL"; createdAt: string }>, workspaceId: string, correlationId: string): Promise<DurablePrinciple> {
    if (!input.durableKnowledgeId.trim() || input.interpretation.authority !== "HUMAN_DECISION") throw new Error("durable principle registration requires a human-authorized gate commit");
    if (input.teachBackOutcome !== "PASS" && input.teachBackOutcome !== "PASS_WITH_UNCERTAINTY") throw new Error("significant principle requires passing teach-back evidence");
    const principle: DurablePrinciple = { principleId: input.principleId, durableKnowledgeId: input.durableKnowledgeId, interpretationId: input.interpretation.interpretationId, statement: input.interpretation.statement, rationale: input.interpretation.rationale, scope: input.interpretation.scope, preconditions: input.interpretation.preconditions, exceptions: input.interpretation.exceptions, authority: "HUMAN_DECISION", status: "ACTIVE", provenanceIds: [...new Set(input.provenanceIds)], createdAt: input.createdAt, immutable: true };
    const stored = await this.registry.append(principle);
    if (this.audit) await this.audit.append({ eventId: `audit:principle-registered:${stored.principleId}`, eventType: "PRINCIPLE_REGISTERED", workspaceId, occurredAt: stored.createdAt, actor: input.interpretation.authorizedBy, correlationId, schemaVersion: "10.0", references: { knowledgeIds: [stored.durableKnowledgeId], provenanceIds: stored.provenanceIds }, payload: { principleId: stored.principleId, status: stored.status, authority: stored.authority } });
    return stored;
  }
}

/** A later observation can request review, but can never rewrite an approved principle. */
export class PrincipleReassessmentService {
  constructor(private readonly audit?: LearningAuditLedger, private readonly repository?: PrincipleReassessmentRepository) {}
  async request(trigger: PrincipleReassessmentTrigger, workspaceId: string, actor: { actorId: string; actorType: "HUMAN" | "AGENT" | "SYSTEM" | "EXTERNAL" }, correlationId: string): Promise<PrincipleReassessmentResult> {
    if (!trigger.principleId.trim() || !trigger.sourceId.trim() || !trigger.rationale.trim()) throw new Error("principle reassessment trigger requires principle, source, and rationale");
    const persisted = this.repository ? await this.repository.append(trigger) : trigger;
    if (this.audit) await this.audit.append({ eventId: `audit:principle-reassessment:${trigger.triggerId}`, eventType: "PRINCIPLE_REASSESSMENT_REQUESTED", workspaceId, occurredAt: trigger.requestedAt, actor, correlationId, schemaVersion: "10.0", references: { knowledgeIds: [trigger.principleId] }, payload: { sourceType: trigger.sourceType, sourceId: trigger.sourceId, principleModified: false } });
    return { trigger: persisted, status: "REVIEW_REQUESTED", persistenceEffect: "CREATED", authorityEffect: "UNCHANGED", executionPermissionGranted: false, principleModified: false };
  }
}

/** Deterministic, inspectable retrieval: it evaluates applicability but cannot grant execution permission. */
export class PrincipleApplicationService {
  constructor(private readonly registry: PrincipleRegistry, private readonly audit?: LearningAuditLedger) {}
  async evaluate(request: PrincipleApplicationRequest, workspaceId: string, actor: DurablePrinciple["authority"] extends never ? never : { actorId: string; actorType: "HUMAN" | "AGENT" | "SYSTEM" | "EXTERNAL" }, correlationId: string): Promise<readonly PrincipleApplicationEvaluation[]> {
    const facts = new Set(request.contextFacts); const evaluations = (await this.registry.list()).map((principle): PrincipleApplicationEvaluation => {
      const matched = scopeMatches(principle.scope, request.scope); const unmet = principle.preconditions.filter((condition) => !facts.has(condition)); const exceptions = principle.exceptions.filter((condition) => facts.has(condition));
      const status = principle.status !== "ACTIVE" ? "NOT_ACTIVE" : !matched ? "OUT_OF_SCOPE" : exceptions.length ? "EXCEPTION_APPLIES" : unmet.length ? "PRECONDITIONS_UNMET" : "APPLIES";
      return { principleId: principle.principleId, status, scopeMatched: matched, satisfiedPreconditions: principle.preconditions.filter((condition) => facts.has(condition)), unmetPreconditions: unmet, applicableExceptions: exceptions, persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false };
    });
    if (this.audit) await this.audit.append({ eventId: `audit:principle-application:${correlationId}`, eventType: "PRINCIPLE_APPLICATION_EVALUATED", workspaceId, occurredAt: new Date().toISOString(), actor, correlationId, schemaVersion: "10.0", references: {}, payload: { requestedScope: request.scope, evaluations: evaluations.map((evaluation) => ({ principleId: evaluation.principleId, status: evaluation.status })) } });
    return evaluations;
  }
}
