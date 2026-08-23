import {
  IDENTIFIED_SCOPE_TYPES,
  type KnowledgeScopeReference,
  type KnowledgeScopeResolutionRequest,
  type KnowledgeScopeResolutionResult,
  type KnowledgeScopeResolver,
  type ScopeChangeProposal,
  type ScopeCompatibilityResult,
} from "../../types/learning-constitution/knowledgeScope";
import type { KnowledgeScope } from "../../types/learning-constitution/constitutionalVocabulary";

export const CONSERVATIVE_SCOPE_RESOLVER_ID = "phase-0-conservative-scope-resolver";
export const CONSERVATIVE_SCOPE_RESOLVER_VERSION = "1.0.0";

const identifiedTypes = new Set<KnowledgeScope>(IDENTIFIED_SCOPE_TYPES);

export const isValidKnowledgeScopeReference = (scope: KnowledgeScopeReference): boolean => {
  if (identifiedTypes.has(scope.type)) {
    return "id" in scope && typeof scope.id === "string" && scope.id.trim().length > 0;
  }

  return scope.type === "SYSTEM" || scope.type === "GLOBAL";
};

const identity = (scope: KnowledgeScopeReference): string =>
  "id" in scope && scope.id ? `${scope.type}:${scope.id}` : scope.type;

const result = (
  request: KnowledgeScopeResolutionRequest,
  values: Omit<
    KnowledgeScopeResolutionResult,
    "provenance" | "promotionRequested" | "persistenceEffect" | "authorityEffect"
  >,
): KnowledgeScopeResolutionResult => ({
  ...values,
  provenance: request.classification.provenance,
  promotionRequested: request.scopeChangeRequested === true,
  persistenceEffect: "NONE",
  authorityEffect: "UNCHANGED",
});

const unresolved = (
  request: KnowledgeScopeResolutionRequest,
  status: "AMBIGUOUS" | "UNRESOLVED" | "CONFLICTING",
  source: KnowledgeScopeResolutionResult["source"],
  rationaleCode: string,
  matchedScopes: readonly KnowledgeScopeReference[] = [],
): KnowledgeScopeResolutionResult =>
  result(request, {
    confidence: 0,
    status,
    source,
    reasoningMetadata: {
      rationaleCode,
      matchedScopeIds: Object.freeze(matchedScopes.map(identity)),
      resolverId: CONSERVATIVE_SCOPE_RESOLVER_ID,
      resolverVersion: CONSERVATIVE_SCOPE_RESOLVER_VERSION,
    },
    requiresClarification: true,
  });

const resolved = (
  request: KnowledgeScopeResolutionRequest,
  scope: KnowledgeScopeReference,
  confidence: number,
  source: KnowledgeScopeResolutionResult["source"],
  rationaleCode: string,
): KnowledgeScopeResolutionResult =>
  result(request, {
    scope,
    confidence,
    status: "RESOLVED",
    source,
    reasoningMetadata: {
      rationaleCode,
      matchedScopeIds: Object.freeze([identity(scope)]),
      resolverId: CONSERVATIVE_SCOPE_RESOLVER_ID,
      resolverVersion: CONSERVATIVE_SCOPE_RESOLVER_VERSION,
    },
    requiresClarification: false,
  });

const mentionsScope = (content: string, scope: KnowledgeScopeReference): boolean => {
  const normalized = content.toLocaleLowerCase();
  if ("id" in scope && scope.id && normalized.includes(scope.id.toLocaleLowerCase())) {
    return true;
  }

  return Boolean(
    scope.displayName && normalized.includes(scope.displayName.toLocaleLowerCase()),
  );
};

const uniqueScopesOfType = (
  scopes: readonly KnowledgeScopeReference[],
  type: KnowledgeScope,
): readonly KnowledgeScopeReference[] => scopes.filter((scope) => scope.type === type);

const defaultScopeTypeForClassification = (
  classification: KnowledgeScopeResolutionRequest["classification"],
): KnowledgeScope | undefined => {
  if (classification.classification === "CONVERSATION") return "CONVERSATION";
  if (classification.classification === "BRAINSTORMING") return "SESSION";
  if (classification.classification === "SUGGESTION") return "SESSION";
  if (classification.classification === "PREFERENCE") return "USER";
  if (classification.classification === "PROJECT_DECISION") return "PROJECT";
  return undefined;
};

export const resolveKnowledgeScopeConservatively = (
  request: KnowledgeScopeResolutionRequest,
): KnowledgeScopeResolutionResult => {
  if (request.classification.status === "AMBIGUOUS" || !request.classification.classification) {
    return unresolved(request, "UNRESOLVED", "NONE", "CLASSIFICATION_UNRESOLVED");
  }

  if (request.explicitScope) {
    if (!isValidKnowledgeScopeReference(request.explicitScope)) {
      return unresolved(request, "UNRESOLVED", "EXPLICIT", "INVALID_EXPLICIT_SCOPE");
    }
    return resolved(request, request.explicitScope, 1, "EXPLICIT", "EXPLICIT_SCOPE");
  }

  const contentMatches = request.knownScopes.filter(
    (scope) => isValidKnowledgeScopeReference(scope) && mentionsScope(request.content, scope),
  );
  if (contentMatches.length === 1) {
    return resolved(
      request,
      contentMatches[0],
      0.98,
      "CONTENT_REFERENCE",
      "UNIQUE_NAMED_SCOPE_REFERENCE",
    );
  }
  if (contentMatches.length > 1) {
    return unresolved(
      request,
      "CONFLICTING",
      "CONTENT_REFERENCE",
      "MULTIPLE_NAMED_SCOPE_REFERENCES",
      contentMatches,
    );
  }

  if (/\b(always|globally|everywhere|all projects|all users)\b/i.test(request.content)) {
    return unresolved(request, "AMBIGUOUS", "NONE", "BROAD_SCOPE_REQUIRES_JUSTIFICATION");
  }

  const hintedType =
    request.classification.scopeHint ??
    defaultScopeTypeForClassification(request.classification);
  if (!hintedType) {
    return unresolved(request, "UNRESOLVED", "NONE", "NO_SCOPE_EVIDENCE");
  }

  const activeMatches = uniqueScopesOfType(request.activeScopes, hintedType).filter(
    isValidKnowledgeScopeReference,
  );
  if (activeMatches.length === 1) {
    return resolved(
      request,
      activeMatches[0],
      0.85,
      "ACTIVE_CONTEXT",
      "HINT_CONFIRMED_BY_ACTIVE_CONTEXT",
    );
  }
  if (activeMatches.length > 1) {
    return unresolved(
      request,
      "AMBIGUOUS",
      "CLASSIFIER_HINT",
      "MULTIPLE_ACTIVE_SCOPES_MATCH_HINT",
      activeMatches,
    );
  }

  return unresolved(
    request,
    "AMBIGUOUS",
    "CLASSIFIER_HINT",
    "SCOPE_HINT_UNCONFIRMED",
  );
};

export class ConservativeKnowledgeScopeResolver implements KnowledgeScopeResolver {
  resolve(request: KnowledgeScopeResolutionRequest): Promise<KnowledgeScopeResolutionResult> {
    return Promise.resolve(resolveKnowledgeScopeConservatively(request));
  }
}

export const evaluateScopeCompatibility = (
  knowledgeScope: KnowledgeScopeReference,
  contextScope: KnowledgeScopeReference,
): ScopeCompatibilityResult => {
  if (
    !isValidKnowledgeScopeReference(knowledgeScope) ||
    !isValidKnowledgeScopeReference(contextScope)
  ) {
    return { outcome: "UNKNOWN", reason: "INVALID_SCOPE" };
  }

  if (identity(knowledgeScope) === identity(contextScope)) {
    return { outcome: "COMPATIBLE", reason: "EXACT_SCOPE_MATCH" };
  }

  return { outcome: "INCOMPATIBLE", reason: "SCOPE_IDENTITY_MISMATCH" };
};

export const createScopeChangeProposal = (
  proposal: Omit<ScopeChangeProposal, "status" | "persistenceEffect" | "authorityEffect">,
): ScopeChangeProposal => ({
  ...proposal,
  status: "PROPOSED",
  persistenceEffect: "NONE",
  authorityEffect: "UNCHANGED",
});
