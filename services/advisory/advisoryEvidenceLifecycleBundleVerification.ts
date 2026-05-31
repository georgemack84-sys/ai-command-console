import {
  buildAdvisoryEvidenceLifecycleExportBundle,
  type AdvisoryEvidenceLifecycleExportBundlePolicyVersions,
} from "./advisoryEvidenceLifecycleExportBundle";

export type AdvisoryLifecycleBundleVerificationStatus =
  | "VALID_BUNDLE"
  | "DISPUTED_BUNDLE"
  | "FAILED_BUNDLE";

export type AdvisoryLifecycleBundleVerificationResult = Readonly<{
  verificationStatus: AdvisoryLifecycleBundleVerificationStatus;
  bundleId: string | null;
  bundleHash: string | null;
  expectedBundleHash: string | null;
  hashMatches: boolean;
  policyVersion: string | null;
  includedHashesVerified: boolean;
  authorityVerified: boolean;
  retentionVerified: boolean;
  rollupVerified: boolean;
  replayable: boolean;
  authority: "READ_ONLY";
  trusted: false;
  importedToLiveState: false;
  mayDeploy: false;
  mayRetry: false;
  mayRollback: false;
  mayCancel: false;
  mayResume: false;
  mayApprove: false;
  mayOverride: false;
  mayDelete: false;
  mayCompact: false;
  mayArchiveMutate: false;
  mayImportToLiveState: false;
  reasons: readonly string[];
}>;

const BUNDLE_VERSION = "advisory-evidence-lifecycle-export-bundle/v1";
const CONTROL_FIELDS = [
  "mayDeploy",
  "mayRetry",
  "mayRollback",
  "mayCancel",
  "mayResume",
  "mayApprove",
  "mayOverride",
  "mayDelete",
  "mayCompact",
  "mayArchiveMutate",
  "mayImportToLiveState",
  "mayMutateArchive",
  "mayTriggerWorkflow",
] as const;

const SAFE_AUTHORITY = {
  authority: "READ_ONLY" as const,
  trusted: false as const,
  importedToLiveState: false as const,
  mayDeploy: false as const,
  mayRetry: false as const,
  mayRollback: false as const,
  mayCancel: false as const,
  mayResume: false as const,
  mayApprove: false as const,
  mayOverride: false as const,
  mayDelete: false as const,
  mayCompact: false as const,
  mayArchiveMutate: false as const,
  mayImportToLiveState: false as const,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function asStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0);
}

function normalizeReasons(reasons: readonly string[]) {
  return Object.freeze([...new Set(reasons)].sort());
}

function result(input: {
  authorityVerified?: boolean;
  bundleHash?: string | null;
  bundleId?: string | null;
  expectedBundleHash?: string | null;
  hashMatches?: boolean;
  includedHashesVerified?: boolean;
  policyVersion?: string | null;
  reasons: readonly string[];
  replayable?: boolean;
  retentionVerified?: boolean;
  rollupVerified?: boolean;
  verificationStatus: AdvisoryLifecycleBundleVerificationStatus;
}): AdvisoryLifecycleBundleVerificationResult {
  return Object.freeze({
    verificationStatus: input.verificationStatus,
    bundleId: input.bundleId ?? null,
    bundleHash: input.bundleHash ?? null,
    expectedBundleHash: input.expectedBundleHash ?? null,
    hashMatches: input.hashMatches ?? false,
    policyVersion: input.policyVersion ?? null,
    includedHashesVerified: input.includedHashesVerified ?? false,
    authorityVerified: input.authorityVerified ?? false,
    retentionVerified: input.retentionVerified ?? false,
    rollupVerified: input.rollupVerified ?? false,
    replayable: input.replayable ?? false,
    ...SAFE_AUTHORITY,
    reasons: normalizeReasons(input.reasons),
  });
}

function scanAuthorityLeaks(value: unknown, path = "bundle"): string[] {
  const reasons: string[] = [];

  if (Array.isArray(value)) {
    value.forEach((entry, index) => {
      reasons.push(...scanAuthorityLeaks(entry, `${path}[${index}]`));
    });
    return reasons;
  }
  if (!isRecord(value)) return reasons;

  if (value.authority !== undefined && value.authority !== "READ_ONLY" && !isRecord(value.authority)) {
    reasons.push(`AUTHORITY_NOT_READ_ONLY:${path}.authority`);
  }
  if (value.trusted === true) reasons.push(`TRUSTED_STATE_LEAK:${path}.trusted`);
  if (value.importedToLiveState === true) reasons.push(`LIVE_IMPORT_LEAK:${path}.importedToLiveState`);

  for (const field of CONTROL_FIELDS) {
    if (value[field] === true) reasons.push(`CONTROL_AUTHORITY_LEAK:${path}.${field}`);
  }

  for (const [key, entry] of Object.entries(value)) {
    reasons.push(...scanAuthorityLeaks(entry, `${path}.${key}`));
  }

  return reasons;
}

function topLevelAuthorityVerified(authority: unknown) {
  if (!isRecord(authority)) return false;
  return authority.trusted === false
    && authority.importedToLiveState === false
    && authority.mayImportToLiveState === false
    && authority.mayMutateArchive === false
    && authority.mayDelete === false
    && authority.mayCompact === false
    && authority.mayApprove === false
    && authority.mayDeploy === false
    && authority.mayTriggerWorkflow === false;
}

function hasRequiredFields(bundle: Record<string, unknown>) {
  return asString(bundle.bundleId)
    && asString(bundle.bundleVersion)
    && isRecord(bundle.hashes)
    && isRecord(bundle.policyVersions)
    && isRecord(bundle.lifecycleRollup)
    && isRecord(bundle.archiveSummary)
    && isRecord(bundle.retentionMetadata)
    && Array.isArray(bundle.reasons)
    && isRecord(bundle.authority);
}

function policyVersionsFrom(value: unknown): Partial<AdvisoryEvidenceLifecycleExportBundlePolicyVersions> {
  if (!isRecord(value)) return {};
  return {
    retentionPolicyVersion: asString(value.retentionPolicyVersion) || undefined,
    archivePolicyVersion: asString(value.archivePolicyVersion) || undefined,
    lifecyclePolicyVersion: asString(value.lifecyclePolicyVersion) || undefined,
  };
}

export function verifyAdvisoryEvidenceLifecycleBundle(
  bundle: unknown,
): AdvisoryLifecycleBundleVerificationResult {
  if (!isRecord(bundle)) {
    return result({
      verificationStatus: "FAILED_BUNDLE",
      reasons: ["BUNDLE_MISSING_OR_MALFORMED"],
    });
  }

  const bundleId = asString(bundle.bundleId);
  const policyVersion = asString(bundle.bundleVersion);
  const hashes = isRecord(bundle.hashes) ? bundle.hashes : null;
  const bundleHash = asString(hashes?.bundleHash);
  const reasons: string[] = [];

  if (!hasRequiredFields(bundle)) {
    return result({
      verificationStatus: "FAILED_BUNDLE",
      bundleId,
      bundleHash,
      policyVersion,
      reasons: ["BUNDLE_REQUIRED_FIELDS_MISSING"],
    });
  }

  if (policyVersion !== BUNDLE_VERSION) reasons.push("BUNDLE_POLICY_VERSION_UNRECOGNIZED");

  const rollupVerified = isRecord(bundle.lifecycleRollup);
  const retentionVerified = isRecord(bundle.retentionMetadata);
  if (!rollupVerified) reasons.push("ROLLUP_METADATA_MISSING");
  if (!retentionVerified) reasons.push("RETENTION_METADATA_MISSING");

  let expectedBundle;
  try {
    expectedBundle = buildAdvisoryEvidenceLifecycleExportBundle({
      lifecycleRollup: bundle.lifecycleRollup,
      archiveSummary: bundle.archiveSummary,
      retentionMetadata: bundle.retentionMetadata,
      generatedAt: asString(bundle.generatedAt) || undefined,
      policyVersions: policyVersionsFrom(bundle.policyVersions),
      reasons: asStringArray(bundle.reasons),
    });
  } catch {
    return result({
      verificationStatus: "FAILED_BUNDLE",
      bundleId,
      bundleHash,
      policyVersion,
      reasons: ["BUNDLE_NORMALIZATION_FAILED"],
    });
  }

  if (bundleHash !== expectedBundle.hashes.bundleHash) reasons.push("BUNDLE_HASH_MISMATCH");
  if (bundleId !== expectedBundle.bundleId) reasons.push("BUNDLE_ID_MISMATCH");
  if (asString(hashes?.rollupHash) !== expectedBundle.hashes.rollupHash) reasons.push("ROLLUP_HASH_MISMATCH");
  if (asString(hashes?.archiveSummaryHash) !== expectedBundle.hashes.archiveSummaryHash) {
    reasons.push("ARCHIVE_SUMMARY_HASH_MISMATCH");
  }
  if (asString(hashes?.retentionHash) !== expectedBundle.hashes.retentionHash) reasons.push("RETENTION_HASH_MISMATCH");

  const authorityLeakReasons = scanAuthorityLeaks(bundle);
  const authorityVerified = topLevelAuthorityVerified(bundle.authority) && authorityLeakReasons.length === 0;
  reasons.push(...authorityLeakReasons);

  const includedHashesVerified = !reasons.some((reason) => reason.endsWith("_HASH_MISMATCH"));
  const hashMatches = bundleHash === expectedBundle.hashes.bundleHash;
  const verificationStatus = reasons.length === 0 ? "VALID_BUNDLE" : "DISPUTED_BUNDLE";

  return result({
    verificationStatus,
    bundleId,
    bundleHash,
    expectedBundleHash: expectedBundle.hashes.bundleHash,
    hashMatches,
    policyVersion,
    includedHashesVerified,
    authorityVerified,
    retentionVerified,
    rollupVerified,
    replayable: verificationStatus === "VALID_BUNDLE",
    reasons,
  });
}
