/**
 * Phase 6, Part I: Authority answers who may establish knowledge within a
 * scope. It is deliberately not a confidence, evidence, durability, or
 * execution-permission score.
 *
 * The authority taxonomy and AuthorityRecord are introduced in later Phase 6
 * parts. Until then, an authority assessment cannot claim any authority.
 */
export const AUTHORITY_MODEL_VERSION = "6.1" as const;

export const KNOWLEDGE_DIMENSION_INVARIANTS = [
  "AUTHORITY_NOT_CONFIDENCE",
  "AUTHORITY_NOT_EVIDENCE",
  "CONFIDENCE_NOT_EVIDENCE",
  "LEARNING_NOT_ACTION_PERMISSION",
] as const;
export type KnowledgeDimensionInvariant = (typeof KNOWLEDGE_DIMENSION_INVARIANTS)[number];

export type AuthorityDimension = Readonly<{
  status: "UNASSESSED";
}>;

export type ConfidenceDimension = Readonly<{
  score: number;
}>;

export type EvidenceDimension = Readonly<{
  evidenceIds: readonly string[];
}>;

export type ProvenanceDimension = Readonly<{
  observationId: string;
  sourceId: string;
}>;

export type DurabilityDimension = Readonly<{
  requested: "NONE" | "SESSION" | "WORKSPACE" | "DURABLE_CANDIDATE";
}>;

export type ValidationDimension = Readonly<{
  status: "NOT_EVALUATED" | "REQUIRES_VALIDATION" | "VALIDATED" | "INVALID";
}>;

export type ActionPermissionDimension = Readonly<{
  granted: false;
}>;

/**
 * A transport-neutral view of the independent dimensions every governed
 * knowledge record must preserve. No generic trust score is permitted.
 */
export type KnowledgeDimensionSet = Readonly<{
  classification: string;
  scope: string;
  authority: AuthorityDimension;
  confidence: ConfidenceDimension;
  evidence: EvidenceDimension;
  provenance: ProvenanceDimension;
  durability: DurabilityDimension;
  validation: ValidationDimension;
  actionPermission: ActionPermissionDimension;
}>;

export const createUnassessedAuthority = (): AuthorityDimension => ({ status: "UNASSESSED" });

/**
 * Guards the Part I firewall at integration boundaries. It intentionally does
 * not resolve authority or authorize action; those responsibilities belong to
 * later Phase 6 components and the independent execution authorization system.
 */
export const validateKnowledgeDimensionSet = (dimensions: KnowledgeDimensionSet): void => {
  if (!Number.isFinite(dimensions.confidence.score) || dimensions.confidence.score < 0 || dimensions.confidence.score > 1) {
    throw new Error("knowledge confidence must be between zero and one");
  }
  if (dimensions.authority.status !== "UNASSESSED") {
    throw new Error("Part I does not permit an unresolved authority taxonomy to establish authority");
  }
  if (dimensions.actionPermission.granted) {
    throw new Error("learning authority must not grant execution permission");
  }
  if (!dimensions.provenance.observationId || !dimensions.provenance.sourceId) {
    throw new Error("knowledge provenance requires observation and source identities");
  }
  if ("trustScore" in dimensions) {
    throw new Error("generic trust scores must not replace independent knowledge dimensions");
  }
};
