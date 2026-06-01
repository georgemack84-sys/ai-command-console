import { hashPayloadDeterministically } from "../contracts/payloadHasher";

export type GovernanceMetaCertificationStatus =
  | "META_CERTIFIED"
  | "META_CONDITIONAL"
  | "META_DISPUTED"
  | "META_FAILED";

export type GovernanceMetaCertificationProcessChecks = Readonly<{
  certificationGatePresent: boolean;
  completionReportPresent: boolean;
  completionBundleVerificationPresent: boolean;
  documentationPresent: boolean;
  adrCoveragePresent: boolean;
  sealHistoryPresent: boolean;
  verificationBeforeReviewPreserved: boolean;
  noLiveImportPreserved: boolean;
  noTrustedStatePreserved: boolean;
  authorityContainmentPreserved: boolean;
}>;

export type GovernanceMetaCertificationArtifact = Readonly<{
  path: string;
  required: boolean;
  present: boolean;
}>;

export type GovernanceMetaCertificationSeal = Readonly<{
  commit: string;
  description: string;
  required: boolean;
  present: boolean;
}>;

export type GovernanceMetaCertificationInput = Readonly<{
  certifiedAt?: string;
  documentedArtifacts: readonly GovernanceMetaCertificationArtifact[];
  sealedCommits: readonly GovernanceMetaCertificationSeal[];
  evidence?: unknown;
  reasons?: readonly string[];
}>;

export type GovernanceMetaCertification = Readonly<{
  metaCertificationStatus: GovernanceMetaCertificationStatus;
  metaCertificationHash: string;
  certifiedAt: string;
  processChecks: GovernanceMetaCertificationProcessChecks;
  documentedArtifacts: readonly GovernanceMetaCertificationArtifact[];
  sealedCommits: readonly GovernanceMetaCertificationSeal[];
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

export const REQUIRED_GOVERNANCE_META_DOCUMENTS = Object.freeze([
  { path: "docs/architecture/overview.md", required: true },
  { path: "docs/architecture/lifecycle-map.md", required: true },
  { path: "docs/architecture/governance-boundaries.md", required: true },
  { path: "docs/architecture/operator-handbook.md", required: true },
  { path: "docs/architecture/verification-workflows.md", required: true },
  { path: "docs/architecture/seal-history.md", required: true },
  { path: "docs/architecture/phase-lineage.md", required: true },
  { path: "docs/adr/ADR-0001-read-only-boundary.md", required: true },
  { path: "docs/adr/ADR-0002-verification-before-review.md", required: true },
  { path: "docs/adr/ADR-0003-no-live-import.md", required: true },
  { path: "docs/adr/ADR-0004-authority-containment.md", required: true },
] as const);

export const OPTIONAL_GOVERNANCE_META_DOCUMENTS = Object.freeze([
  { path: "docs/architecture/maintenance-notes.md", required: false },
] as const);

export const REQUIRED_GOVERNANCE_META_SEALS = Object.freeze([
  { commit: "d8d93d2", description: "Advisory evidence lifecycle certification gate", required: true },
  { commit: "a54f98f", description: "Advisory evidence lifecycle completion report", required: true },
  { commit: "560d39f", description: "Advisory evidence lifecycle completion bundle verification", required: true },
  { commit: "673467a", description: "Advisory evidence lifecycle completion export bundle", required: true },
  { commit: "1fc193f", description: "Advisory evidence lifecycle completion bundle review UI", required: true },
  { commit: "3674ed5", description: "Advisory evidence lifecycle completion bundle chain seal", required: true },
  { commit: "62a87a7", description: "Advisory evidence lifecycle completion review seal", required: true },
  { commit: "5b8ee3e", description: "Lifecycle documentation layer", required: true },
] as const);

const SAFE_AUTHORITY = Object.freeze({
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
});

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

function sha256(value: unknown) {
  return `sha256:${hashPayloadDeterministically(value)}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeReasons(reasons: readonly string[]) {
  return Object.freeze([...new Set(reasons)].sort());
}

function normalizeArtifacts(artifacts: readonly GovernanceMetaCertificationArtifact[]) {
  return Object.freeze([...artifacts]
    .map((artifact) => Object.freeze({
      path: artifact.path,
      required: artifact.required,
      present: artifact.present,
    }))
    .sort((left, right) => left.path.localeCompare(right.path)));
}

function normalizeSeals(seals: readonly GovernanceMetaCertificationSeal[]) {
  return Object.freeze([...seals]
    .map((seal) => Object.freeze({
      commit: seal.commit,
      description: seal.description,
      required: seal.required,
      present: seal.present,
    }))
    .sort((left, right) => left.commit.localeCompare(right.commit)));
}

function validArtifacts(value: unknown): value is readonly GovernanceMetaCertificationArtifact[] {
  return Array.isArray(value) && value.every((artifact) => (
    isRecord(artifact)
    && typeof artifact.path === "string"
    && typeof artifact.required === "boolean"
    && typeof artifact.present === "boolean"
  ));
}

function validSeals(value: unknown): value is readonly GovernanceMetaCertificationSeal[] {
  return Array.isArray(value) && value.every((seal) => (
    isRecord(seal)
    && typeof seal.commit === "string"
    && typeof seal.description === "string"
    && typeof seal.required === "boolean"
    && typeof seal.present === "boolean"
  ));
}

function byPath(artifacts: readonly GovernanceMetaCertificationArtifact[]) {
  return new Map(artifacts.map((artifact) => [artifact.path, artifact]));
}

function byCommit(seals: readonly GovernanceMetaCertificationSeal[]) {
  return new Map(seals.map((seal) => [seal.commit, seal]));
}

function requiredDocumentReasons(artifacts: readonly GovernanceMetaCertificationArtifact[]) {
  const reasons: string[] = [];
  const artifactsByPath = byPath(artifacts);
  for (const requiredDocument of REQUIRED_GOVERNANCE_META_DOCUMENTS) {
    const artifact = artifactsByPath.get(requiredDocument.path);
    if (!artifact || !artifact.present) reasons.push(`REQUIRED_DOCUMENT_MISSING:${requiredDocument.path}`);
  }
  for (const artifact of artifacts) {
    if (artifact.required && !artifact.present) reasons.push(`REQUIRED_DOCUMENT_MISSING:${artifact.path}`);
    if (!artifact.required && !artifact.present) reasons.push(`OPTIONAL_DOCUMENT_MISSING:${artifact.path}`);
  }
  return reasons;
}

function requiredSealReasons(seals: readonly GovernanceMetaCertificationSeal[]) {
  const reasons: string[] = [];
  const sealsByCommit = byCommit(seals);
  for (const requiredSeal of REQUIRED_GOVERNANCE_META_SEALS) {
    const seal = sealsByCommit.get(requiredSeal.commit);
    if (!seal || !seal.present) reasons.push(`REQUIRED_SEAL_MISSING:${requiredSeal.commit}`);
  }
  for (const seal of seals) {
    if (seal.required && !seal.present) reasons.push(`REQUIRED_SEAL_MISSING:${seal.commit}`);
  }
  return reasons;
}

function scanAuthorityLeaks(value: unknown, path = "metaCertificationEvidence"): string[] {
  const reasons: string[] = [];
  if (Array.isArray(value)) {
    value.forEach((entry, index) => reasons.push(...scanAuthorityLeaks(entry, `${path}[${index}]`)));
    return reasons;
  }
  if (!isRecord(value)) return reasons;

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

function presentArtifact(artifacts: readonly GovernanceMetaCertificationArtifact[], path: string) {
  return byPath(artifacts).get(path)?.present === true;
}

function presentSeal(seals: readonly GovernanceMetaCertificationSeal[], commit: string) {
  return byCommit(seals).get(commit)?.present === true;
}

function processChecksFor(
  artifacts: readonly GovernanceMetaCertificationArtifact[],
  seals: readonly GovernanceMetaCertificationSeal[],
): GovernanceMetaCertificationProcessChecks {
  const requiredDocsPresent = REQUIRED_GOVERNANCE_META_DOCUMENTS.every((artifact) => presentArtifact(artifacts, artifact.path));
  const requiredAdrsPresent = [
    "docs/adr/ADR-0001-read-only-boundary.md",
    "docs/adr/ADR-0002-verification-before-review.md",
    "docs/adr/ADR-0003-no-live-import.md",
    "docs/adr/ADR-0004-authority-containment.md",
  ].every((path) => presentArtifact(artifacts, path));

  return Object.freeze({
    certificationGatePresent: presentSeal(seals, "d8d93d2"),
    completionReportPresent: presentSeal(seals, "a54f98f"),
    completionBundleVerificationPresent: presentSeal(seals, "560d39f"),
    documentationPresent: requiredDocsPresent,
    adrCoveragePresent: requiredAdrsPresent,
    sealHistoryPresent: presentArtifact(artifacts, "docs/architecture/seal-history.md"),
    verificationBeforeReviewPreserved: presentArtifact(artifacts, "docs/adr/ADR-0002-verification-before-review.md"),
    noLiveImportPreserved: presentArtifact(artifacts, "docs/adr/ADR-0003-no-live-import.md")
      && presentArtifact(artifacts, "docs/architecture/governance-boundaries.md"),
    noTrustedStatePreserved: presentArtifact(artifacts, "docs/adr/ADR-0003-no-live-import.md")
      && presentArtifact(artifacts, "docs/architecture/governance-boundaries.md"),
    authorityContainmentPreserved: presentArtifact(artifacts, "docs/adr/ADR-0001-read-only-boundary.md")
      && presentArtifact(artifacts, "docs/adr/ADR-0004-authority-containment.md"),
  });
}

function processCheckReasons(checks: GovernanceMetaCertificationProcessChecks) {
  const reasons: string[] = [];
  if (!checks.certificationGatePresent) reasons.push("PROCESS_CHECK_FAILED:certificationGatePresent");
  if (!checks.completionReportPresent) reasons.push("PROCESS_CHECK_FAILED:completionReportPresent");
  if (!checks.completionBundleVerificationPresent) reasons.push("PROCESS_CHECK_FAILED:completionBundleVerificationPresent");
  if (!checks.documentationPresent) reasons.push("PROCESS_CHECK_FAILED:documentationPresent");
  if (!checks.adrCoveragePresent) reasons.push("PROCESS_CHECK_FAILED:adrCoveragePresent");
  if (!checks.sealHistoryPresent) reasons.push("PROCESS_CHECK_FAILED:sealHistoryPresent");
  if (!checks.verificationBeforeReviewPreserved) reasons.push("PROCESS_CONTRADICTION:verificationBeforeReview");
  if (!checks.noLiveImportPreserved) reasons.push("PROCESS_CONTRADICTION:noLiveImport");
  if (!checks.noTrustedStatePreserved) reasons.push("PROCESS_CONTRADICTION:noTrustedState");
  if (!checks.authorityContainmentPreserved) reasons.push("PROCESS_CONTRADICTION:authorityContainment");
  return reasons;
}

function statusFor(reasons: readonly string[]) {
  if (reasons.includes("META_CERTIFICATION_INPUT_MALFORMED") || reasons.some((reason) => (
    reason.startsWith("REQUIRED_DOCUMENT_MISSING:")
    || reason.startsWith("REQUIRED_SEAL_MISSING:")
    || reason === "PROCESS_CHECK_FAILED:certificationGatePresent"
    || reason === "PROCESS_CHECK_FAILED:completionReportPresent"
    || reason === "PROCESS_CHECK_FAILED:completionBundleVerificationPresent"
    || reason === "PROCESS_CHECK_FAILED:documentationPresent"
    || reason === "PROCESS_CHECK_FAILED:adrCoveragePresent"
    || reason === "PROCESS_CHECK_FAILED:sealHistoryPresent"
  ))) {
    return "META_FAILED" as const;
  }
  if (reasons.some((reason) => (
    reason.startsWith("CONTROL_AUTHORITY_LEAK:")
    || reason.startsWith("TRUSTED_STATE_LEAK:")
    || reason.startsWith("LIVE_IMPORT_LEAK:")
    || reason.startsWith("PROCESS_CONTRADICTION:")
  ))) {
    return "META_DISPUTED" as const;
  }
  if (reasons.some((reason) => reason.startsWith("OPTIONAL_DOCUMENT_MISSING:"))) {
    return "META_CONDITIONAL" as const;
  }
  return "META_CERTIFIED" as const;
}

function hashMaterial(input: {
  metaCertificationStatus: GovernanceMetaCertificationStatus;
  processChecks: GovernanceMetaCertificationProcessChecks;
  documentedArtifacts: readonly GovernanceMetaCertificationArtifact[];
  sealedCommits: readonly GovernanceMetaCertificationSeal[];
  reasons: readonly string[];
}) {
  return {
    metaCertificationStatus: input.metaCertificationStatus,
    processChecks: input.processChecks,
    documentedArtifacts: input.documentedArtifacts,
    sealedCommits: input.sealedCommits,
    ...SAFE_AUTHORITY,
    reasons: input.reasons,
  };
}

function buildResult(input: {
  metaCertificationStatus: GovernanceMetaCertificationStatus;
  certifiedAt: string;
  processChecks: GovernanceMetaCertificationProcessChecks;
  documentedArtifacts: readonly GovernanceMetaCertificationArtifact[];
  sealedCommits: readonly GovernanceMetaCertificationSeal[];
  reasons: readonly string[];
}): GovernanceMetaCertification {
  const reasons = normalizeReasons(input.reasons);
  const metaCertificationHash = sha256(hashMaterial({
    metaCertificationStatus: input.metaCertificationStatus,
    processChecks: input.processChecks,
    documentedArtifacts: input.documentedArtifacts,
    sealedCommits: input.sealedCommits,
    reasons,
  }));

  return Object.freeze({
    metaCertificationStatus: input.metaCertificationStatus,
    metaCertificationHash,
    certifiedAt: input.certifiedAt,
    processChecks: input.processChecks,
    documentedArtifacts: input.documentedArtifacts,
    sealedCommits: input.sealedCommits,
    ...SAFE_AUTHORITY,
    reasons,
  });
}

export function certifyAdvisoryGovernanceProcess(input: unknown): GovernanceMetaCertification {
  const certifiedAt = isRecord(input) && typeof input.certifiedAt === "string"
    ? input.certifiedAt
    : new Date().toISOString();

  if (!isRecord(input) || !validArtifacts(input.documentedArtifacts) || !validSeals(input.sealedCommits)) {
    const processChecks = Object.freeze({
      certificationGatePresent: false,
      completionReportPresent: false,
      completionBundleVerificationPresent: false,
      documentationPresent: false,
      adrCoveragePresent: false,
      sealHistoryPresent: false,
      verificationBeforeReviewPreserved: false,
      noLiveImportPreserved: false,
      noTrustedStatePreserved: false,
      authorityContainmentPreserved: false,
    });
    return buildResult({
      metaCertificationStatus: "META_FAILED",
      certifiedAt,
      processChecks,
      documentedArtifacts: Object.freeze([]),
      sealedCommits: Object.freeze([]),
      reasons: ["META_CERTIFICATION_INPUT_MALFORMED"],
    });
  }

  const documentedArtifacts = normalizeArtifacts(input.documentedArtifacts);
  const sealedCommits = normalizeSeals(input.sealedCommits);
  const processChecks = processChecksFor(documentedArtifacts, sealedCommits);
  const reasons = normalizeReasons([
    ...requiredDocumentReasons(documentedArtifacts),
    ...requiredSealReasons(sealedCommits),
    ...processCheckReasons(processChecks),
    ...scanAuthorityLeaks(input.evidence),
    ...(Array.isArray(input.reasons) ? input.reasons.filter((reason): reason is string => typeof reason === "string") : []),
  ]);
  const metaCertificationStatus = statusFor(reasons);

  return buildResult({
    metaCertificationStatus,
    certifiedAt,
    processChecks,
    documentedArtifacts,
    sealedCommits,
    reasons,
  });
}
