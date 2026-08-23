import type {
  TaxonomyChangeProposal,
  TaxonomyCompatibilityAnalysis,
  TaxonomyRegistrySnapshot,
} from "../../types/learning-constitution";
import { validateTaxonomyExtensionAnalysis } from "./taxonomyLifecycle";

type Semver = Readonly<{ major: number; minor: number; patch: number }>;

const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const parseSemver = (value: string): Semver => {
  const match = SEMVER.exec(value);
  if (!match) throw new Error("taxonomy version must be a stable semantic version");
  return { major: Number(match[1]), minor: Number(match[2]), patch: Number(match[3]) };
};
const compareSemver = (left: Semver, right: Semver): number =>
  left.major - right.major || left.minor - right.minor || left.patch - right.patch;
const isNonEmptyString = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;
const validateSnapshot = (snapshot: TaxonomyRegistrySnapshot): void => {
  parseSemver(snapshot.taxonomyVersion);
  if (!Array.isArray(snapshot.categoryIds) || snapshot.categoryIds.length === 0 ||
    !snapshot.categoryIds.every(isNonEmptyString) || new Set(snapshot.categoryIds).size !== snapshot.categoryIds.length) {
    throw new Error("taxonomy registry snapshot is invalid");
  }
};

export const analyzeTaxonomyCompatibility = (
  current: TaxonomyRegistrySnapshot,
  proposed: TaxonomyRegistrySnapshot,
): TaxonomyCompatibilityAnalysis => {
  validateSnapshot(current);
  validateSnapshot(proposed);
  const currentVersion = parseSemver(current.taxonomyVersion);
  const proposedVersion = parseSemver(proposed.taxonomyVersion);
  if (compareSemver(proposedVersion, currentVersion) <= 0) throw new Error("proposed taxonomy version must advance");
  const addedCategoryIds = proposed.categoryIds.filter((category) => !current.categoryIds.includes(category));
  const removedCategoryIds = current.categoryIds.filter((category) => !proposed.categoryIds.includes(category));
  const status = removedCategoryIds.length > 0 ? "BREAKING" : "COMPATIBLE";
  const requiredVersionBump = removedCategoryIds.length > 0 ? "MAJOR" : addedCategoryIds.length > 0 ? "MINOR" : "PATCH";
  const versionBump = proposedVersion.major > currentVersion.major ? "MAJOR" : proposedVersion.minor > currentVersion.minor ? "MINOR" : "PATCH";
  const acceptedBump = requiredVersionBump === "MAJOR" ? versionBump === "MAJOR" : requiredVersionBump === "MINOR" ? versionBump !== "PATCH" : true;
  if (!acceptedBump) throw new Error("proposed taxonomy version does not meet the required semantic-version bump");
  return { currentVersion: current.taxonomyVersion, proposedVersion: proposed.taxonomyVersion, addedCategoryIds, removedCategoryIds, status, requiredVersionBump };
};

export const validateTaxonomyChangeProposal = (proposal: TaxonomyChangeProposal): TaxonomyChangeProposal => {
  if (!isNonEmptyString(proposal.proposalId) || !isNonEmptyString(proposal.summary) || !Array.isArray(proposal.regressionCaseIds) ||
    proposal.regressionCaseIds.length === 0 || !proposal.regressionCaseIds.every(isNonEmptyString)) {
    throw new Error("taxonomy change proposal is incomplete");
  }
  const analysis = analyzeTaxonomyCompatibility(proposal.current, proposal.proposed);
  if (JSON.stringify(analysis) !== JSON.stringify(proposal.compatibility)) throw new Error("taxonomy change compatibility analysis is stale or invalid");
  if (analysis.addedCategoryIds.length > 0) {
    if (!proposal.extensionAnalysis || proposal.extensionAnalysis.proposedCategoryId !== analysis.addedCategoryIds[0]) {
      throw new Error("taxonomy extension requires a complete extension analysis");
    }
    validateTaxonomyExtensionAnalysis(proposal.extensionAnalysis);
  } else if (proposal.extensionAnalysis !== undefined) {
    throw new Error("non-extension taxonomy changes must not claim extension analysis");
  }
  if (analysis.status === "BREAKING") {
    if (!proposal.migrationPlan || !isNonEmptyString(proposal.migrationPlan.planId) ||
      !proposal.migrationPlan.affectedCategoryIds.every(isNonEmptyString) ||
      !isNonEmptyString(proposal.migrationPlan.strategy) || !isNonEmptyString(proposal.migrationPlan.rollbackStrategy)) {
      throw new Error("breaking taxonomy change requires a complete migration and rollback plan");
    }
  } else if (proposal.migrationPlan !== undefined) {
    throw new Error("compatible taxonomy change must not claim a migration plan");
  }
  const approval = proposal.approval;
  if (!["PENDING", "APPROVED", "REJECTED"].includes(approval.status) ||
    (approval.status === "PENDING" && (approval.decidedBy !== undefined || approval.decidedAt !== undefined)) ||
    (approval.status !== "PENDING" && (!isNonEmptyString(approval.decidedBy) || !isNonEmptyString(approval.decidedAt) || !isNonEmptyString(approval.decisionReason)))) {
    throw new Error("taxonomy change approval is invalid");
  }
  return proposal;
};
