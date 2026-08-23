import type { ClassificationProvenance } from "./informationClassification";
import type { KnowledgeScopeReference } from "./knowledgeScope";
import type { AuthorityType } from "./authorityTaxonomy";

/**
 * Phase 6, Part III: the durable metadata required to explain a particular
 * authority claim. Provenance remains a separate record of where information
 * was observed; this record describes why its source may establish knowledge.
 */
export type AuthorityRecord = Readonly<{
  authorityId: string;
  authorityType: AuthorityType;
  authoritySource: string;
  sourceIdentity: string;
  scope: KnowledgeScopeReference;
  establishedAt: string;
  effectiveFrom: string;
  effectiveUntil?: string;
  supersedes: readonly string[];
  approvedBy?: string;
  approvalRecord?: string;
  delegatedFrom?: string;
  constraints: readonly string[];
  provenance: ClassificationProvenance;
}>;

const isNonBlank = (value: string): boolean => value.trim().length > 0;

const parseTimestamp = (value: string, field: string): number => {
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) throw new Error(`authority record ${field} must be an ISO-8601 timestamp`);
  return timestamp;
};

/** Validates metadata shape only; it does not resolve, rank, or approve authority. */
export const validateAuthorityRecord = (record: AuthorityRecord): void => {
  for (const [field, value] of Object.entries({
    authorityId: record.authorityId,
    authoritySource: record.authoritySource,
    sourceIdentity: record.sourceIdentity,
  })) {
    if (!isNonBlank(value)) throw new Error(`authority record ${field} is required`);
  }

  if ((record.scope.type !== "SYSTEM" && record.scope.type !== "GLOBAL") && !isNonBlank(record.scope.id ?? "")) {
    throw new Error("identified authority scope requires an identity");
  }

  parseTimestamp(record.establishedAt, "establishedAt");
  const effectiveFrom = parseTimestamp(record.effectiveFrom, "effectiveFrom");
  if (record.effectiveUntil !== undefined && parseTimestamp(record.effectiveUntil, "effectiveUntil") < effectiveFrom) {
    throw new Error("authority record effectiveUntil must not precede effectiveFrom");
  }
  if ((record.authorityType === "APPROVED_POLICY" || record.authorityType === "APPROVED_REFERENCE") && (!record.approvedBy || !record.approvalRecord)) {
    throw new Error("approved authority requires approver and approval record");
  }
  if (!record.provenance.observationId || !record.provenance.sourceId) {
    throw new Error("authority record provenance requires observation and source identities");
  }
};
