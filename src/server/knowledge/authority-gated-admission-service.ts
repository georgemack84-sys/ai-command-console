import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/src/server/db/prisma";
import { ConservativeAuthorityConflictDetector, ConservativeAuthorityResolver, ConservativeConflictDetector, FailClosedAuthorityGate, ScopeAwareAuthorityPrecedenceEvaluator, ScopeBoundAuthorityBoundaryEvaluator, validateAuthorityRecord } from "@/services/learning-constitution";
import type { AuthorityConflictResult, AuthorityRecord, AuthorityResolutionResult, InformationClassificationResult, KnowledgeComparisonSubject, KnowledgeScopeReference, KnowledgeScopeResolutionResult } from "@/types/learning-constitution";
import type { KnowledgeRecord, KnowledgeScope, ScopeKind } from "./scope-types";

const scopeType: Record<ScopeKind, KnowledgeScopeReference["type"]> = { global: "GLOBAL", program: "DOMAIN", project: "PROJECT", component: "COMPONENT", task: "TASK", session: "SESSION" };
type AdmissionResult = Readonly<{ status: "ADMITTED"; knowledgeId: string }> | Readonly<{ status: "REVIEW_REQUIRED"; reviewId: string; reasonCode: string }>;

const authorityScope = (scope: KnowledgeScope, scopes: readonly KnowledgeScope[]): KnowledgeScopeReference => {
  const parent = scope.parentId ? scopes.find((candidate) => candidate.id === scope.parentId) : undefined;
  const current = { type: scopeType[scope.kind], id: scope.id } as Exclude<KnowledgeScopeReference, { type: "SYSTEM" | "GLOBAL" }>;
  return parent ? { ...current, parentScope: { type: scopeType[parent.kind], id: parent.id } } : current;
};

const noConflict = (): AuthorityConflictResult => ({ outcome: "NO_CONFLICT", reasonCode: "KNOWLEDGE_COMPATIBLE", persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false });
const reviewConflict = (): AuthorityConflictResult => ({ outcome: "REQUIRE_HUMAN_REVIEW", reasonCode: "CONFLICT_REQUIRES_HUMAN_REVIEW", persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false });
const normalizeSemanticIdentity = (value: string) => value.trim().replace(/\s+/g, " ").toLocaleLowerCase();
const semanticValueIsValid = (value: string, kind: string, allowedValues: readonly string[]): boolean => {
  if (kind === "IDENTIFIER") return /^[a-z][a-z0-9._:-]*$/i.test(value);
  if (kind === "BOOLEAN") return /^(true|false)$/i.test(value);
  if (kind === "URL") { try { const url = new URL(value); return url.protocol === "https:" || url.protocol === "http:"; } catch { return false; } }
  if (kind === "VERSION") return /^v?\d+(\.\d+){1,3}([-.+][0-9a-z.-]+)?$/i.test(value);
  if (kind === "ENUM") return allowedValues.some((item) => normalizeSemanticIdentity(item) === value);
  return true;
};

async function validateSemanticKeyGovernance(workspaceId: string, scopeKind: ScopeKind, key: string, value: string): Promise<string | undefined> {
  const rule = await prisma.knowledgeSemanticKeyRecord.findUnique({ where: { workspaceId_key: { workspaceId, key } } });
  if (!rule) return "SEMANTIC_KEY_UNREGISTERED";
  if (rule.status === "DEPRECATED") return "SEMANTIC_KEY_DEPRECATED";
  if (rule.status === "RETIRED") return "SEMANTIC_KEY_RETIRED";
  if (rule.status !== "ACTIVE") return "SEMANTIC_KEY_INACTIVE";
  if (!rule.allowedScopeKinds.includes(scopeKind)) return "SEMANTIC_KEY_SCOPE_NOT_ALLOWED";
  if (!semanticValueIsValid(value, rule.valueKind, rule.allowedValues)) return "SEMANTIC_VALUE_INVALID";
  return undefined;
}

function storedAuthority(value: Prisma.JsonValue | null): AuthorityRecord | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  try { const authority = value as unknown as AuthorityRecord; validateAuthorityRecord(authority); return authority; } catch { return null; }
}

async function detectKnowledgeConflict(input: { workspaceId: string; incoming: AuthorityRecord; scope: KnowledgeScopeReference; title: string; content: string; semanticKey: string; semanticValue: string; records: readonly KnowledgeRecord[] }) {
  const candidate: KnowledgeComparisonSubject = { knowledgeId: input.incoming.provenance.observationId, content: input.content, classification: "PROJECT_DECISION", scope: input.scope, provenance: input.incoming.provenance, semanticKey: input.semanticKey, value: input.semanticValue };
  for (const record of input.records) {
    if (record.semanticKey !== candidate.semanticKey) continue;
    const ledger = await prisma.authorityLedgerEventRecord.findFirst({ where: { authorityId: `authority:${record.id}` }, orderBy: { occurredAt: "desc" } });
    const existingAuthority = storedAuthority(ledger?.authorityRecord ?? null);
    if (!existingAuthority) {
      if (record.semanticValue !== candidate.value) return { conflict: reviewConflict(), relatedAuthorityId: `authority:${record.id}` };
      continue;
    }
    const existing: KnowledgeComparisonSubject = { knowledgeId: record.id, content: record.content, classification: "PROJECT_DECISION", scope: existingAuthority.scope, provenance: existingAuthority.provenance, semanticKey: record.semanticKey, value: record.semanticValue };
    const knowledgeConflict = await new ConservativeConflictDetector().detect({ candidate, existingKnowledge: existing });
    const precedence = new ScopeAwareAuthorityPrecedenceEvaluator().evaluate({ existing: existingAuthority, incoming: input.incoming, relationshipIntent: "COEXIST" });
    const conflict = new ConservativeAuthorityConflictDetector().detect({ existingAuthority, incomingAuthority: input.incoming, knowledgeConflict, precedence });
    if (conflict.outcome !== "NO_CONFLICT" && conflict.outcome !== "COEXIST") return { conflict, relatedAuthorityId: existingAuthority.authorityId };
  }
  return { conflict: noConflict() };
}

/** Governs the explicit manual knowledge-submission action as a scoped human decision. */
export async function admitManualKnowledgeDecision(input: { workspaceId: string; actorId: string; scope: KnowledgeScope; scopes: readonly KnowledgeScope[]; records: readonly KnowledgeRecord[]; title: string; content: string; semanticKey?: string; semanticValue?: string; inheritable: boolean; overrideOfId?: string | null }): Promise<AdmissionResult> {
  const knowledgeId = randomUUID();
  const authorityId = `authority:${knowledgeId}`;
  const sourceReference = `manual-knowledge:${knowledgeId}`;
  const now = new Date().toISOString();
  const provenance = { observationId: knowledgeId, sourceId: sourceReference, sourceType: "OPERATOR_STATEMENT" as const, originatingActorId: input.actorId, observedAt: now };
  const classification: InformationClassificationResult = { classification: "PROJECT_DECISION", confidence: 1, status: "CLASSIFIED", proposedDurability: "DURABLE_CANDIDATE", requiresValidation: true, provenance, reasoningMetadata: { rationaleCode: "EXPLICIT_MANUAL_KNOWLEDGE_SUBMISSION", matchedSignals: ["create-knowledge"], classifierId: "scope-knowledge-api", classifierVersion: "1" }, relationshipHints: { supersedesKnowledgeIds: input.overrideOfId ? [input.overrideOfId] : [], exceptionToKnowledgeIds: [] }, persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false };
  const resolvedScope = authorityScope(input.scope, input.scopes);
  const scopeResolution: KnowledgeScopeResolutionResult = { scope: resolvedScope, confidence: 1, status: "RESOLVED", source: "EXPLICIT", provenance, reasoningMetadata: { rationaleCode: "SELECTED_KNOWLEDGE_SCOPE", matchedScopeIds: [input.scope.id], resolverId: "scope-knowledge-api", resolverVersion: "1" }, requiresClarification: false, promotionRequested: false, persistenceEffect: "NONE", authorityEffect: "UNCHANGED" };
  const resolution = new ConservativeAuthorityResolver().resolve({ classification, scopeResolution, source: { sourceClass: "HUMAN", sourceIdentity: `user:${input.actorId}`, sourceReference } });
  const authority: AuthorityRecord = { authorityId, authorityType: "HUMAN_DECISION", authoritySource: sourceReference, sourceIdentity: `user:${input.actorId}`, scope: resolvedScope, establishedAt: now, effectiveFrom: now, supersedes: [], constraints: [`workspace:${input.workspaceId}`, `knowledge:${knowledgeId}`], provenance };
  const boundary = new ScopeBoundAuthorityBoundaryEvaluator().evaluate({ authority, subjectScope: resolvedScope });
  const declaredSemanticKey = normalizeSemanticIdentity(input.semanticKey || input.title);
  const declaredSemanticValue = normalizeSemanticIdentity(input.semanticValue || input.content);
  const semanticGovernanceReason = await validateSemanticKeyGovernance(input.workspaceId, input.scope.kind, declaredSemanticKey, declaredSemanticValue);
  const detected = semanticGovernanceReason ? { conflict: reviewConflict(), relatedAuthorityId: undefined } : input.overrideOfId ? { conflict: reviewConflict(), relatedAuthorityId: `authority:${input.overrideOfId}` } : await detectKnowledgeConflict({ workspaceId: input.workspaceId, incoming: authority, scope: resolvedScope, title: input.title, content: input.content, semanticKey: declaredSemanticKey, semanticValue: declaredSemanticValue, records: input.records });
  const gate = new FailClosedAuthorityGate().evaluate({ resolution: resolution as AuthorityResolutionResult, authorityRecord: authority, boundary, conflict: detected.conflict });

  if (gate.decision !== "ALLOW") {
    const reviewId = randomUUID();
    const reviewReason = semanticGovernanceReason ?? (gate.reasonCode === "UNRESOLVED_CONFLICT" ? detected.conflict.reasonCode : gate.reasonCode);
    await prisma.$transaction(async (transaction) => {
      await transaction.authorityReviewRequestRecord.create({ data: { reviewId, workspaceId: input.workspaceId, authorityRecord: authority as Prisma.InputJsonValue, knowledgeSubmission: { knowledgeId, scopeId: input.scope.id, title: input.title.trim(), content: input.content.trim(), semanticKey: declaredSemanticKey, semanticValue: declaredSemanticValue, conflictingKnowledgeId: detected.relatedAuthorityId?.replace("authority:", "") ?? null, inheritable: input.inheritable, overrideOfId: input.overrideOfId ?? null, actorId: input.actorId } as Prisma.InputJsonValue, reasonCode: reviewReason } });
      await transaction.authorityLedgerEventRecord.create({ data: { eventId: `ledger:${reviewId}`, eventType: "AUTHORITY_CHALLENGED", authorityId, relatedAuthorityId: detected.relatedAuthorityId, reason: reviewReason, authorityRecord: authority as Prisma.InputJsonValue, evidenceIds: [], occurredAt: new Date(now) } });
      if (!semanticGovernanceReason && detected.conflict.outcome !== "NO_CONFLICT" && detected.conflict.outcome !== "COEXIST") await transaction.authorityLedgerEventRecord.create({ data: { eventId: `ledger:conflict:${reviewId}`, eventType: "CONFLICT_DETECTED", authorityId, relatedAuthorityId: detected.relatedAuthorityId, reason: detected.conflict.reasonCode, authorityRecord: authority as Prisma.InputJsonValue, evidenceIds: [], occurredAt: new Date(now) } });
    });
    return { status: "REVIEW_REQUIRED", reviewId, reasonCode: reviewReason };
  }

  await prisma.$transaction(async (transaction) => {
    await transaction.knowledgeEntry.create({ data: { id: knowledgeId, workspaceId: input.workspaceId, scopeId: input.scope.id, title: input.title.trim(), content: input.content.trim(), semanticKey: declaredSemanticKey, semanticValue: declaredSemanticValue, inheritance: input.inheritable ? "inheritable" : "local_only", visibility: "workspace", overrideOfId: input.overrideOfId ?? null, createdById: input.actorId } });
    await transaction.authorityLedgerEventRecord.create({ data: { eventId: `ledger:${authorityId}`, eventType: "AUTHORITY_ASSIGNED", authorityId, reason: "HUMAN_DECISION_ADMITTED", authorityRecord: authority as Prisma.InputJsonValue, evidenceIds: [], occurredAt: new Date(now) } });
  });
  return { status: "ADMITTED", knowledgeId };
}
