import type { InformationClassificationResult } from "./informationClassification";
import type { ClassificationProvenance } from "./informationClassification";
import type { KnowledgeScope } from "./constitutionalVocabulary";

export const SCOPE_RESOLUTION_STATUSES = [
  "RESOLVED",
  "AMBIGUOUS",
  "UNRESOLVED",
  "CONFLICTING",
] as const;
export type ScopeResolutionStatus = (typeof SCOPE_RESOLUTION_STATUSES)[number];

export const SCOPE_RESOLUTION_SOURCES = [
  "EXPLICIT",
  "CONTENT_REFERENCE",
  "ACTIVE_CONTEXT",
  "CLASSIFIER_HINT",
  "NONE",
] as const;
export type ScopeResolutionSource = (typeof SCOPE_RESOLUTION_SOURCES)[number];

export const IDENTIFIED_SCOPE_TYPES = [
  "CONVERSATION",
  "SESSION",
  "USER",
  "AGENT",
  "PROJECT",
  "WORKSPACE",
  "ORGANIZATION",
  "DOMAIN",
  "COMPONENT",
  "TASK",
] as const;
export type IdentifiedScopeType = (typeof IDENTIFIED_SCOPE_TYPES)[number];

export type ParentScopeReference = Readonly<{
  type: KnowledgeScope;
  id?: string;
}>;

export type IdentifiedKnowledgeScopeReference = Readonly<{
  type: IdentifiedScopeType;
  id: string;
  displayName?: string;
  parentScope?: ParentScopeReference;
}>;

export type RootKnowledgeScopeReference = Readonly<{
  type: "SYSTEM" | "GLOBAL";
  id?: never;
  displayName?: string;
  parentScope?: never;
}>;

export type KnowledgeScopeReference =
  | IdentifiedKnowledgeScopeReference
  | RootKnowledgeScopeReference;

export type ScopeReasoningMetadata = Readonly<{
  rationaleCode: string;
  matchedScopeIds: readonly string[];
  resolverId: string;
  resolverVersion: string;
}>;

export type KnowledgeScopeResolutionRequest = Readonly<{
  content: string;
  classification: InformationClassificationResult;
  knownScopes: readonly KnowledgeScopeReference[];
  activeScopes: readonly KnowledgeScopeReference[];
  explicitScope?: KnowledgeScopeReference;
  scopeChangeRequested?: boolean;
}>;

export type KnowledgeScopeResolutionResult = Readonly<{
  scope?: KnowledgeScopeReference;
  confidence: number;
  status: ScopeResolutionStatus;
  source: ScopeResolutionSource;
  provenance: ClassificationProvenance;
  reasoningMetadata: ScopeReasoningMetadata;
  requiresClarification: boolean;
  promotionRequested: boolean;
  persistenceEffect: "NONE";
  authorityEffect: "UNCHANGED";
}>;

export interface KnowledgeScopeResolver {
  resolve(request: KnowledgeScopeResolutionRequest): Promise<KnowledgeScopeResolutionResult>;
}

export const SCOPE_COMPATIBILITY_OUTCOMES = [
  "COMPATIBLE",
  "INCOMPATIBLE",
  "UNKNOWN",
] as const;
export type ScopeCompatibilityOutcome = (typeof SCOPE_COMPATIBILITY_OUTCOMES)[number];

export type ScopeCompatibilityResult = Readonly<{
  outcome: ScopeCompatibilityOutcome;
  reason: "EXACT_SCOPE_MATCH" | "SCOPE_IDENTITY_MISMATCH" | "INVALID_SCOPE";
}>;

export const SCOPE_CHANGE_DIRECTIONS = ["PROMOTION", "DEMOTION"] as const;
export type ScopeChangeDirection = (typeof SCOPE_CHANGE_DIRECTIONS)[number];

export type ScopeChangeProposal = Readonly<{
  proposalId: string;
  direction: ScopeChangeDirection;
  fromScope: KnowledgeScopeReference;
  toScope: KnowledgeScopeReference;
  reason: string;
  provenance: ClassificationProvenance;
  status: "PROPOSED";
  persistenceEffect: "NONE";
  authorityEffect: "UNCHANGED";
}>;
