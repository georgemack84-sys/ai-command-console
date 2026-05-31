import { hashPayloadDeterministically } from "../contracts/payloadHasher";

export type AdvisoryEvidenceLifecycleExportBundleAuthority = Readonly<{
  trusted: false;
  importedToLiveState: false;
  mayImportToLiveState: false;
  mayMutateArchive: false;
  mayDelete: false;
  mayCompact: false;
  mayApprove: false;
  mayDeploy: false;
  mayTriggerWorkflow: false;
}>;

export type AdvisoryEvidenceLifecycleExportBundlePolicyVersions = Readonly<{
  retentionPolicyVersion: string;
  archivePolicyVersion: string;
  lifecyclePolicyVersion: string;
}>;

export type AdvisoryEvidenceLifecycleExportBundle = Readonly<{
  bundleId: string;
  bundleVersion: string;
  generatedAt: string;
  lifecycleRollup: unknown;
  archiveSummary: unknown;
  retentionMetadata: unknown;
  hashes: Readonly<{
    rollupHash: string;
    archiveSummaryHash: string;
    retentionHash: string;
    bundleHash: string;
  }>;
  policyVersions: AdvisoryEvidenceLifecycleExportBundlePolicyVersions;
  reasons: readonly string[];
  authority: AdvisoryEvidenceLifecycleExportBundleAuthority;
}>;

export type BuildAdvisoryEvidenceLifecycleExportBundleInput = Readonly<{
  lifecycleRollup: unknown;
  archiveSummary: unknown;
  retentionMetadata: unknown;
  generatedAt?: string;
  policyVersions?: Partial<AdvisoryEvidenceLifecycleExportBundlePolicyVersions>;
  reasons?: readonly string[];
}>;

const BUNDLE_VERSION = "advisory-evidence-lifecycle-export-bundle/v1";
const ARCHIVE_POLICY_VERSION = "advisory-evidence-archive-summary/v1";
const LIFECYCLE_POLICY_VERSION = "advisory-evidence-lifecycle-rollup/v1";
const RETENTION_POLICY_VERSION = "advisory-evidence-retention/v1";

function sha256(value: unknown) {
  return `sha256:${hashPayloadDeterministically(value)}`;
}

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

function normalizeHashValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    const normalized = value.map((entry) => normalizeHashValue(entry));
    if (normalized.every((entry) => typeof entry === "string")) {
      return Object.freeze([...new Set(normalized as string[])].sort());
    }
    return Object.freeze([...normalized].sort((left, right) => (
      hashPayloadDeterministically(left).localeCompare(hashPayloadDeterministically(right))
    )));
  }
  if (!isRecord(value)) return value;

  return Object.freeze(Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => key !== "generatedAt" && key !== "evaluatedAt" && key !== "indexedAt")
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, normalizeHashValue(entry)]),
  ));
}

function normalizePolicyVersion(value: unknown, fallback: string) {
  return asString(value) || fallback;
}

function collectReasons(...values: readonly unknown[]) {
  return normalizeReasons(values.flatMap((value) => (isRecord(value) ? asStringArray(value.reasons) : [])));
}

function resolvePolicyVersions(
  lifecycleRollup: unknown,
  archiveSummary: unknown,
  retentionMetadata: unknown,
  overrides: Partial<AdvisoryEvidenceLifecycleExportBundlePolicyVersions> = {},
): AdvisoryEvidenceLifecycleExportBundlePolicyVersions {
  const lifecyclePolicyVersions = isRecord(lifecycleRollup)
    ? asStringArray(lifecycleRollup.policyVersions)
    : [];

  return Object.freeze({
    retentionPolicyVersion: overrides.retentionPolicyVersion
      || (isRecord(retentionMetadata) ? normalizePolicyVersion(retentionMetadata.policyVersion, RETENTION_POLICY_VERSION) : RETENTION_POLICY_VERSION),
    archivePolicyVersion: overrides.archivePolicyVersion
      || (isRecord(archiveSummary) ? normalizePolicyVersion(archiveSummary.policyVersion, ARCHIVE_POLICY_VERSION) : ARCHIVE_POLICY_VERSION),
    lifecyclePolicyVersion: overrides.lifecyclePolicyVersion
      || lifecyclePolicyVersions.find((policyVersion) => policyVersion.includes("lifecycle"))
      || LIFECYCLE_POLICY_VERSION,
  });
}

function buildBundleHashMaterial(input: {
  archiveSummary: unknown;
  authority: AdvisoryEvidenceLifecycleExportBundleAuthority;
  hashes: Omit<AdvisoryEvidenceLifecycleExportBundle["hashes"], "bundleHash">;
  lifecycleRollup: unknown;
  policyVersions: AdvisoryEvidenceLifecycleExportBundlePolicyVersions;
  reasons: readonly string[];
  retentionMetadata: unknown;
}) {
  return {
    archiveSummary: normalizeHashValue(input.archiveSummary),
    authority: input.authority,
    bundleVersion: BUNDLE_VERSION,
    hashes: input.hashes,
    lifecycleRollup: normalizeHashValue(input.lifecycleRollup),
    policyVersions: input.policyVersions,
    reasons: input.reasons,
    retentionMetadata: normalizeHashValue(input.retentionMetadata),
  };
}

export function buildAdvisoryEvidenceLifecycleExportBundle(
  input: BuildAdvisoryEvidenceLifecycleExportBundleInput,
): AdvisoryEvidenceLifecycleExportBundle {
  const generatedAt = input.generatedAt || new Date().toISOString();
  const authority = Object.freeze({
    trusted: false as const,
    importedToLiveState: false as const,
    mayImportToLiveState: false as const,
    mayMutateArchive: false as const,
    mayDelete: false as const,
    mayCompact: false as const,
    mayApprove: false as const,
    mayDeploy: false as const,
    mayTriggerWorkflow: false as const,
  });
  const policyVersions = resolvePolicyVersions(
    input.lifecycleRollup,
    input.archiveSummary,
    input.retentionMetadata,
    input.policyVersions,
  );
  const reasons = normalizeReasons([
    ...collectReasons(input.lifecycleRollup, input.archiveSummary, input.retentionMetadata),
    ...(input.reasons || []),
  ]);
  const evidenceHashes = {
    rollupHash: sha256(normalizeHashValue(input.lifecycleRollup)),
    archiveSummaryHash: sha256(normalizeHashValue(input.archiveSummary)),
    retentionHash: sha256(normalizeHashValue(input.retentionMetadata)),
  };
  const bundleHash = sha256(buildBundleHashMaterial({
    archiveSummary: input.archiveSummary,
    authority,
    hashes: evidenceHashes,
    lifecycleRollup: input.lifecycleRollup,
    policyVersions,
    reasons,
    retentionMetadata: input.retentionMetadata,
  }));
  const bundleId = sha256({
    bundleHash,
    bundleVersion: BUNDLE_VERSION,
  });

  return Object.freeze({
    bundleId,
    bundleVersion: BUNDLE_VERSION,
    generatedAt,
    lifecycleRollup: input.lifecycleRollup,
    archiveSummary: input.archiveSummary,
    retentionMetadata: input.retentionMetadata,
    hashes: Object.freeze({
      ...evidenceHashes,
      bundleHash,
    }),
    policyVersions,
    reasons,
    authority,
  });
}
