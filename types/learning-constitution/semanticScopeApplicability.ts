import {
  CANONICAL_SCOPE_DIMENSIONS,
  type CanonicalScopeDimension,
} from "./canonicalScopeTaxonomy";

export type SemanticScopeIdentity = Readonly<{
  dimension: CanonicalScopeDimension;
  identifier?: string;
}>;

export type SemanticScopeReference = Readonly<{
  identity: SemanticScopeIdentity;
  parent?: SemanticScopeReference;
}>;

export const SCOPE_CONTAINMENT_OUTCOMES = [
  "APPLIES",
  "DOES_NOT_APPLY",
  "REQUIRES_REVIEW",
] as const;
export type ScopeContainmentOutcome =
  (typeof SCOPE_CONTAINMENT_OUTCOMES)[number];

export const SCOPE_CONTAINMENT_REASONS = [
  "EXACT_IDENTITY",
  "EXPLICIT_PARENT_CHAIN",
  "DISTINCT_IDENTITIES",
  "INVALID_SCOPE_REFERENCE",
  "PARENTAGE_CYCLE",
] as const;
export type ScopeContainmentReason = (typeof SCOPE_CONTAINMENT_REASONS)[number];

export type ScopeContainmentResult = Readonly<{
  outcome: ScopeContainmentOutcome;
  reason: ScopeContainmentReason;
  persistenceEffect: "NONE";
  authorityEffect: "UNCHANGED";
  executionPermissionGranted: false;
}>;

export const SCOPE_APPLICABILITY_REASONS = [
  "EXACT_IDENTITY",
  "EXPLICIT_INHERITANCE",
  "WIDENING_PROPOSAL_REQUIRED",
  "DISTINCT_IDENTITIES",
  "INVALID_SCOPE_REFERENCE",
  "PARENTAGE_CYCLE",
] as const;
export type ScopeApplicabilityReason =
  (typeof SCOPE_APPLICABILITY_REASONS)[number];

export type SemanticScopeApplicabilityResult = Readonly<{
  outcome: ScopeContainmentOutcome;
  reason: ScopeApplicabilityReason;
  persistenceEffect: "NONE";
  authorityEffect: "UNCHANGED";
  executionPermissionGranted: false;
}>;

export type ScopeWideningProposal = Readonly<{
  proposalId: string;
  sourceScope: SemanticScopeReference;
  targetScope: SemanticScopeReference;
  rationale: string;
  status: "PROPOSED";
  persistenceEffect: "NONE";
  authorityEffect: "UNCHANGED";
  executionPermissionGranted: false;
}>;

export type ScopeWideningProposalResult = Readonly<{
  outcome: "PROPOSED" | "REJECTED";
  reason:
    | "EXPLICIT_ANCESTOR_TARGET"
    | "TARGET_IS_NOT_WIDER"
    | "INVALID_SCOPE_REFERENCE"
    | "PARENTAGE_CYCLE";
  proposal?: ScopeWideningProposal;
  persistenceEffect: "NONE";
  authorityEffect: "UNCHANGED";
  executionPermissionGranted: false;
}>;

const canonicalDimensions = new Set<string>(CANONICAL_SCOPE_DIMENSIONS);

const nonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

export const isValidSemanticScopeIdentity = (
  identity: SemanticScopeIdentity,
): boolean => {
  if (!canonicalDimensions.has(identity.dimension)) return false;
  if (identity.dimension === "SYSTEM") return identity.identifier === undefined;
  return nonEmptyString(identity.identifier);
};

export const semanticScopeIdentityKey = (
  identity: SemanticScopeIdentity,
): string =>
  identity.identifier
    ? `${identity.dimension}:${identity.identifier}`
    : identity.dimension;

const hasInvalidIdentityOrSystemParentage = (
  scope: SemanticScopeReference,
): boolean => {
  const visited = new Set<string>();
  let current: SemanticScopeReference | undefined = scope;

  while (current) {
    if (!isValidSemanticScopeIdentity(current.identity)) return true;
    const key = semanticScopeIdentityKey(current.identity);
    if (visited.has(key)) return false;
    visited.add(key);
    if (current.identity.dimension === "SYSTEM" && current.parent !== undefined)
      return true;
    current = current.parent;
  }

  return false;
};

const hasParentageCycle = (scope: SemanticScopeReference): boolean => {
  const visited = new Set<string>();
  let current: SemanticScopeReference | undefined = scope;

  while (current) {
    const key = semanticScopeIdentityKey(current.identity);
    if (visited.has(key)) return true;
    visited.add(key);
    current = current.parent;
  }

  return false;
};

export const isValidSemanticScopeReference = (
  scope: SemanticScopeReference,
): boolean =>
  !hasInvalidIdentityOrSystemParentage(scope) && !hasParentageCycle(scope);

const result = (
  outcome: ScopeContainmentOutcome,
  reason: ScopeContainmentReason,
): ScopeContainmentResult => ({
  outcome,
  reason,
  persistenceEffect: "NONE",
  authorityEffect: "UNCHANGED",
  executionPermissionGranted: false,
});

const applicabilityResult = (
  outcome: ScopeContainmentOutcome,
  reason: ScopeApplicabilityReason,
): SemanticScopeApplicabilityResult => ({
  outcome,
  reason,
  persistenceEffect: "NONE",
  authorityEffect: "UNCHANGED",
  executionPermissionGranted: false,
});

/**
 * Evaluates applicability only. It does not infer a hierarchy and never grants
 * authority, persistence, promotion, or permission to execute.
 */
export const evaluateSemanticScopeContainment = (
  subject: SemanticScopeReference,
  container: SemanticScopeReference,
): ScopeContainmentResult => {
  if (
    hasInvalidIdentityOrSystemParentage(subject) ||
    hasInvalidIdentityOrSystemParentage(container)
  ) {
    return result("REQUIRES_REVIEW", "INVALID_SCOPE_REFERENCE");
  }
  if (hasParentageCycle(subject) || hasParentageCycle(container)) {
    return result("REQUIRES_REVIEW", "PARENTAGE_CYCLE");
  }

  const containerKey = semanticScopeIdentityKey(container.identity);
  let current: SemanticScopeReference | undefined = subject;
  let depth = 0;
  while (current) {
    if (semanticScopeIdentityKey(current.identity) === containerKey) {
      return result(
        "APPLIES",
        depth === 0 ? "EXACT_IDENTITY" : "EXPLICIT_PARENT_CHAIN",
      );
    }
    current = current.parent;
    depth += 1;
  }

  return result("DOES_NOT_APPLY", "DISTINCT_IDENTITIES");
};

/**
 * Applies information to an exact context or an explicitly nested context.
 * A broader target is review-only: applicability never widens by inference.
 */
export const evaluateSemanticScopeApplicability = (
  informationScope: SemanticScopeReference,
  contextScope: SemanticScopeReference,
): SemanticScopeApplicabilityResult => {
  const inherited = evaluateSemanticScopeContainment(
    contextScope,
    informationScope,
  );
  if (inherited.outcome === "APPLIES") {
    return applicabilityResult(
      "APPLIES",
      inherited.reason === "EXACT_IDENTITY"
        ? "EXACT_IDENTITY"
        : "EXPLICIT_INHERITANCE",
    );
  }
  if (inherited.reason === "INVALID_SCOPE_REFERENCE") {
    return applicabilityResult("REQUIRES_REVIEW", "INVALID_SCOPE_REFERENCE");
  }
  if (inherited.reason === "PARENTAGE_CYCLE") {
    return applicabilityResult("REQUIRES_REVIEW", "PARENTAGE_CYCLE");
  }

  const targetIsWider = evaluateSemanticScopeContainment(
    informationScope,
    contextScope,
  );
  if (targetIsWider.outcome === "APPLIES") {
    return applicabilityResult("REQUIRES_REVIEW", "WIDENING_PROPOSAL_REQUIRED");
  }

  return applicabilityResult("DOES_NOT_APPLY", "DISTINCT_IDENTITIES");
};

/**
 * Makes an explicit widening request available for later governance. It neither
 * changes applicability nor approves, persists, or executes anything.
 */
export const proposeSemanticScopeWidening = (
  proposal: Omit<
    ScopeWideningProposal,
    | "status"
    | "persistenceEffect"
    | "authorityEffect"
    | "executionPermissionGranted"
  >,
): ScopeWideningProposalResult => {
  const widening = evaluateSemanticScopeApplicability(
    proposal.sourceScope,
    proposal.targetScope,
  );
  if (widening.reason === "INVALID_SCOPE_REFERENCE") {
    return {
      outcome: "REJECTED",
      reason: "INVALID_SCOPE_REFERENCE",
      persistenceEffect: "NONE",
      authorityEffect: "UNCHANGED",
      executionPermissionGranted: false,
    };
  }
  if (widening.reason === "PARENTAGE_CYCLE") {
    return {
      outcome: "REJECTED",
      reason: "PARENTAGE_CYCLE",
      persistenceEffect: "NONE",
      authorityEffect: "UNCHANGED",
      executionPermissionGranted: false,
    };
  }
  if (widening.reason !== "WIDENING_PROPOSAL_REQUIRED") {
    return {
      outcome: "REJECTED",
      reason: "TARGET_IS_NOT_WIDER",
      persistenceEffect: "NONE",
      authorityEffect: "UNCHANGED",
      executionPermissionGranted: false,
    };
  }

  return {
    outcome: "PROPOSED",
    reason: "EXPLICIT_ANCESTOR_TARGET",
    proposal: {
      ...proposal,
      status: "PROPOSED",
      persistenceEffect: "NONE",
      authorityEffect: "UNCHANGED",
      executionPermissionGranted: false,
    },
    persistenceEffect: "NONE",
    authorityEffect: "UNCHANGED",
    executionPermissionGranted: false,
  };
};
