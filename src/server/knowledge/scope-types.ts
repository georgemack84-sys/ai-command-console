export const SCOPE_KINDS = ["global", "program", "project", "component", "task", "session"] as const;

export type ScopeKind = (typeof SCOPE_KINDS)[number];
export type KnowledgeInheritance = "inheritable" | "local-only";

export type KnowledgeScope = {
  id: string;
  name: string;
  kind: ScopeKind;
  parentId: string | null;
  createdAt: string;
};

export type KnowledgePromotion = {
  id: string;
  sourceKnowledgeId: string;
  sourceScopeId: string;
  targetScopeId: string;
  promotedBy: string;
  promotedAt: string;
  status?: "pending" | "approved" | "rejected";
  approvedBy?: string | null;
  rejectionReason?: string | null;
};

export type AuthorityReviewRequest = {
  id: string;
  knowledgeId: string | null;
  scopeId: string | null;
  title: string;
  content: string;
  semanticKey: string;
  semanticValue: string;
  conflictingKnowledgeId: string | null;
  inheritable: boolean;
  overrideOfId: string | null;
  reasonCode: string;
  status: "pending" | "approved" | "rejected";
  requestedAt: string;
  resolvedAt: string | null;
  resolvedBy: string | null;
  rejectionReason: string | null;
  resolutionAction: "coexist" | "supersede" | "reject" | null;
};

export type KnowledgeRecord = {
  id: string;
  scopeId: string;
  title: string;
  content: string;
  semanticKey: string;
  semanticValue: string;
  inheritance: KnowledgeInheritance;
  visibility: "workspace";
  sourceKnowledgeId: string | null;
  sourceScopeId: string | null;
  overrideOfId: string | null;
  supersededAt: string | null;
  supersededById: string | null;
  promotionHistory: KnowledgePromotion[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type KnowledgeLineageEvent = {
  id: string;
  type: string;
  reason: string;
  occurredAt: string;
  authorizedBy: string | null;
  relatedKnowledgeId: string | null;
};

export type KnowledgeLineage = {
  knowledgeId: string;
  authorityType: string | null;
  sourceIdentity: string | null;
  establishedAt: string | null;
  supersededAt: string | null;
  supersededById: string | null;
  events: KnowledgeLineageEvent[];
};

export type SemanticKeyRule = {
  key: string;
  description: string;
  allowedScopeKinds: ScopeKind[];
  valueKind: "TEXT" | "IDENTIFIER" | "BOOLEAN" | "URL" | "VERSION" | "ENUM";
  allowedValues: string[];
  ownerId: string;
  version: number;
  status: "active" | "deprecated" | "retired";
};

export type SemanticKeyChangeRequest = Omit<SemanticKeyRule, "version" | "status"> & {
  id: string;
  baseVersion: number;
  requestedById: string;
  requestedAt: string;
  operation: "UPSERT" | "DEPRECATE" | "RETIRE";
};

export type SemanticKeyAudit = {
  key: string;
  versions: Array<{ version: number; status: string; description: string; activatedAt: string; retiredAt: string | null; proposedBy: string | null; approvedBy: string | null; rejectionReason: string | null }>;
  events: Array<{ id: string; type: string; reason: string; occurredAt: string; actorId: string | null }>;
};

export type GovernanceReviewItem = {
  knowledgeId: string;
  title: string;
  semanticKey: string;
  scopeId: string;
  reasons: Array<"STALE_KNOWLEDGE" | "DEPRECATED_SEMANTIC_KEY" | "RETIRED_SEMANTIC_KEY" | "UNREGISTERED_SEMANTIC_KEY">;
  nextReviewAt: string;
};

export type ScopeKnowledgeStore = {
  scopes: KnowledgeScope[];
  records: KnowledgeRecord[];
  promotionRequests: KnowledgePromotion[];
  authorityReviewRequests: AuthorityReviewRequest[];
  lineage: KnowledgeLineage[];
  semanticKeyRules: SemanticKeyRule[];
  semanticKeyChangeRequests: SemanticKeyChangeRequest[];
  semanticKeyAudit: SemanticKeyAudit[];
  governanceReviewItems: GovernanceReviewItem[];
};

export type ResolvedKnowledgeRecord = KnowledgeRecord & {
  origin: "local" | "inherited";
  inheritedFromScopeId: string | null;
};

export type RuntimeKnowledgeContext = {
  scope: Pick<KnowledgeScope, "id" | "name" | "kind" | "parentId">;
  entries: Array<{
    id: string;
    title: string;
    content: string;
    origin: "local" | "inherited";
    sourceScopeId: string;
    inheritance: KnowledgeInheritance;
  }>;
};
