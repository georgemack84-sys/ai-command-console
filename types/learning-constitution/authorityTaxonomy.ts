/**
 * Phase 6, Part II: canonical vocabulary for kinds of knowledge authority.
 * These types are semantic labels, not a strength ranking. Scope, delegation,
 * approval, time, conflicts, and precedence remain later Phase 6 concerns.
 */
export const AUTHORITY_TYPES = [
  "HUMAN_DIRECTIVE",
  "HUMAN_DECISION",
  "HUMAN_CORRECTION",
  "HUMAN_PREFERENCE",
  "APPROVED_POLICY",
  "APPROVED_REFERENCE",
  "VERIFIED_EXTERNAL_INFORMATION",
  "AGENT_DERIVED",
  "AGENT_INFERRED",
  "AGENT_HYPOTHESIS",
] as const;
export type AuthorityType = (typeof AUTHORITY_TYPES)[number];

export const AUTHORITY_SOURCE_CLASSES = ["HUMAN", "GOVERNANCE", "REFERENCE", "EXTERNAL", "AGENT"] as const;
export type AuthoritySourceClass = (typeof AUTHORITY_SOURCE_CLASSES)[number];

export type AuthorityTaxonomyEntry = Readonly<{
  type: AuthorityType;
  sourceClass: AuthoritySourceClass;
  semanticMeaning: string;
  doesNotImply: readonly string[];
}>;

export const AUTHORITY_TAXONOMY: Readonly<Record<AuthorityType, AuthorityTaxonomyEntry>> = {
  HUMAN_DIRECTIVE: {
    type: "HUMAN_DIRECTIVE",
    sourceClass: "HUMAN",
    semanticMeaning: "An explicit human instruction within a scope.",
    doesNotImply: ["truth", "evidence sufficiency", "execution permission"],
  },
  HUMAN_DECISION: {
    type: "HUMAN_DECISION",
    sourceClass: "HUMAN",
    semanticMeaning: "A deliberate human selection that establishes scoped state.",
    doesNotImply: ["a general directive", "execution permission"],
  },
  HUMAN_CORRECTION: {
    type: "HUMAN_CORRECTION",
    sourceClass: "HUMAN",
    semanticMeaning: "An explicit human correction of previously established information.",
    doesNotImply: ["destructive deletion", "unbounded scope", "execution permission"],
  },
  HUMAN_PREFERENCE: {
    type: "HUMAN_PREFERENCE",
    sourceClass: "HUMAN",
    semanticMeaning: "A human preference that may influence recommendations within its scope.",
    doesNotImply: ["a hard constraint", "a directive", "execution permission"],
  },
  APPROVED_POLICY: {
    type: "APPROVED_POLICY",
    sourceClass: "GOVERNANCE",
    semanticMeaning: "A formally adopted rule with separately recorded approval and scope.",
    doesNotImply: ["unlimited scope", "execution permission"],
  },
  APPROVED_REFERENCE: {
    type: "APPROVED_REFERENCE",
    sourceClass: "REFERENCE",
    semanticMeaning: "A source designated authoritative for a specific subject and scope.",
    doesNotImply: ["universal authority", "project decision rights", "execution permission"],
  },
  VERIFIED_EXTERNAL_INFORMATION: {
    type: "VERIFIED_EXTERNAL_INFORMATION",
    sourceClass: "EXTERNAL",
    semanticMeaning: "Well-supported external information that can inform knowledge without making project decisions.",
    doesNotImply: ["human decision authority", "policy authority", "execution permission"],
  },
  AGENT_DERIVED: {
    type: "AGENT_DERIVED",
    sourceClass: "AGENT",
    semanticMeaning: "A conclusion mechanically derived from established information.",
    doesNotImply: ["human establishment", "decision authority", "execution permission"],
  },
  AGENT_INFERRED: {
    type: "AGENT_INFERRED",
    sourceClass: "AGENT",
    semanticMeaning: "A reasonable but not explicitly established agent conclusion.",
    doesNotImply: ["human preference", "human decision", "execution permission"],
  },
  AGENT_HYPOTHESIS: {
    type: "AGENT_HYPOTHESIS",
    sourceClass: "AGENT",
    semanticMeaning: "A provisional agent proposition intended for investigation.",
    doesNotImply: ["established knowledge", "authority promotion", "execution permission"],
  },
};

export const getAuthorityTaxonomyEntry = (authorityType: AuthorityType): AuthorityTaxonomyEntry => AUTHORITY_TAXONOMY[authorityType];
