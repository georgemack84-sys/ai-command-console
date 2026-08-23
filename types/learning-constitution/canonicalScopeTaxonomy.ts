import type { KnowledgeScope } from "./constitutionalVocabulary";

export const CANONICAL_SCOPE_TAXONOMY_VERSION = "1.0.0" as const;

export const CANONICAL_SCOPE_DIMENSIONS = [
  "SESSION", "CONVERSATION", "USER", "PROJECT", "WORKSPACE", "AGENT", "ORGANIZATION", "SYSTEM",
] as const;
export type CanonicalScopeDimension = (typeof CANONICAL_SCOPE_DIMENSIONS)[number];

export const SCOPE_APPLICABILITY_STATUSES = [
  "UNRESOLVED", "RESOLVED", "AMBIGUOUS", "CONFLICTING", "REQUIRES_REVIEW",
] as const;
export type ScopeApplicabilityStatus = (typeof SCOPE_APPLICABILITY_STATUSES)[number];

export type CanonicalScopeDimensionDefinition = Readonly<{
  id: CanonicalScopeDimension;
  requiresIdentifier: boolean;
  definition: string;
  mustNotImply: string;
}>;

export const CANONICAL_SCOPE_DEFINITIONS: Readonly<
  Record<CanonicalScopeDimension, CanonicalScopeDimensionDefinition>
> = {
  SESSION: { id: "SESSION", requiresIdentifier: true, definition: "A bounded working session.", mustNotImply: "durability beyond the session" },
  CONVERSATION: { id: "CONVERSATION", requiresIdentifier: true, definition: "A bounded interaction thread.", mustNotImply: "user-wide applicability" },
  USER: { id: "USER", requiresIdentifier: true, definition: "Information attributed to one user.", mustNotImply: "organizational authority" },
  PROJECT: { id: "PROJECT", requiresIdentifier: true, definition: "Information limited to one identified project.", mustNotImply: "workspace-wide applicability" },
  WORKSPACE: { id: "WORKSPACE", requiresIdentifier: true, definition: "Information limited to one identified workspace.", mustNotImply: "organization-wide applicability" },
  AGENT: { id: "AGENT", requiresIdentifier: true, definition: "Information limited to one identified agent instance or role.", mustNotImply: "authority for that agent" },
  ORGANIZATION: { id: "ORGANIZATION", requiresIdentifier: true, definition: "Information limited to one identified organization.", mustNotImply: "system-wide applicability" },
  SYSTEM: { id: "SYSTEM", requiresIdentifier: false, definition: "Information intended for the system boundary.", mustNotImply: "authorization, execution, or constitutional amendment" },
};

export type LegacyScopeMapping = Readonly<{
  canonicalDimension?: CanonicalScopeDimension;
  status: "DIRECT" | "REQUIRES_REVIEW";
  migrationNote: string;
}>;

export const LEGACY_SCOPE_TAXONOMY_MAPPING: Readonly<Record<KnowledgeScope, LegacyScopeMapping>> = {
  CONVERSATION: { canonicalDimension: "CONVERSATION", status: "DIRECT", migrationNote: "Direct mapping." },
  SESSION: { canonicalDimension: "SESSION", status: "DIRECT", migrationNote: "Direct mapping." },
  USER: { canonicalDimension: "USER", status: "DIRECT", migrationNote: "Direct mapping." },
  AGENT: { canonicalDimension: "AGENT", status: "DIRECT", migrationNote: "Direct mapping." },
  PROJECT: { canonicalDimension: "PROJECT", status: "DIRECT", migrationNote: "Direct mapping." },
  WORKSPACE: { canonicalDimension: "WORKSPACE", status: "DIRECT", migrationNote: "Direct mapping." },
  ORGANIZATION: { canonicalDimension: "ORGANIZATION", status: "DIRECT", migrationNote: "Direct mapping." },
  SYSTEM: { canonicalDimension: "SYSTEM", status: "DIRECT", migrationNote: "Direct mapping; scope does not grant authority." },
  DOMAIN: { status: "REQUIRES_REVIEW", migrationNote: "Domain is a separate applicability dimension, not a canonical scope level." },
  COMPONENT: { status: "REQUIRES_REVIEW", migrationNote: "Component scope requires explicit authority-boundary review until added to the canonical scope taxonomy." },
  TASK: { status: "REQUIRES_REVIEW", migrationNote: "Task scope requires explicit authority-boundary review until added to the canonical scope taxonomy." },
  GLOBAL: { canonicalDimension: "SYSTEM", status: "REQUIRES_REVIEW", migrationNote: "GLOBAL requires explicit system-boundary review; it is not silently widened." },
};

export const isCanonicalScopeDimension = (value: unknown): value is CanonicalScopeDimension =>
  typeof value === "string" && (CANONICAL_SCOPE_DIMENSIONS as readonly string[]).includes(value);
