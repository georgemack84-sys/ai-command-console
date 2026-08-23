export type TaxonomyRegistrySnapshot = Readonly<{
  taxonomyVersion: string;
  categoryIds: readonly string[];
}>;

export type TaxonomyCompatibilityAnalysis = Readonly<{
  currentVersion: string;
  proposedVersion: string;
  addedCategoryIds: readonly string[];
  removedCategoryIds: readonly string[];
  status: "COMPATIBLE" | "BREAKING";
  requiredVersionBump: "PATCH" | "MINOR" | "MAJOR";
}>;

export type TaxonomyMigrationPlan = Readonly<{
  planId: string;
  affectedCategoryIds: readonly string[];
  strategy: string;
  rollbackStrategy: string;
}>;

export type TaxonomyChangeApproval = Readonly<{
  status: "PENDING" | "APPROVED" | "REJECTED";
  decidedBy?: string;
  decidedAt?: string;
  decisionReason?: string;
}>;

export type TaxonomyChangeProposal = Readonly<{
  proposalId: string;
  summary: string;
  current: TaxonomyRegistrySnapshot;
  proposed: TaxonomyRegistrySnapshot;
  compatibility: TaxonomyCompatibilityAnalysis;
  migrationPlan?: TaxonomyMigrationPlan;
  extensionAnalysis?: import("./taxonomyLifecycle").TaxonomyExtensionAnalysis;
  regressionCaseIds: readonly string[];
  approval: TaxonomyChangeApproval;
}>;
