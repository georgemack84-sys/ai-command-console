import { hashPayloadDeterministically } from "../contracts/payloadHasher";

export type GovernanceProgramStatus =
  | "PROGRAM_COMPLETE"
  | "PROGRAM_CONDITIONAL"
  | "PROGRAM_DISPUTED"
  | "PROGRAM_FAILED";

export type GovernanceProgramChain = Readonly<{
  chain: string;
  required: boolean;
  present: boolean;
}>;

export type GovernanceProgramSeal = Readonly<{
  commit: string;
  description: string;
  required: boolean;
  present: boolean;
}>;

export type GovernanceProgramGuarantees = Readonly<{
  deterministic: boolean;
  readOnly: boolean;
  replayable: boolean;
  reviewable: boolean;
  documented: boolean;
  metaCertified: boolean;
  authorityContained: boolean;
  nonAuthoritative: boolean;
  nonMutating: boolean;
  trustedStateAbsent: boolean;
  liveImportAbsent: boolean;
  workflowControlAbsent: boolean;
}>;

export type GovernanceProgramCoverageItem = Readonly<{
  item: string;
  required: boolean;
  present: boolean;
}>;

export type GovernanceProgramMaintenanceTrack = Readonly<{
  track: string;
  optional: boolean;
  authoritative: boolean;
  runtime: boolean;
  present?: boolean;
}>;

export type GovernanceProgramSummary = Readonly<{
  architectureSealed: boolean;
  verificationSealed: boolean;
  reviewSealed: boolean;
  documentationSealed: boolean;
  metaCertificationSealed: boolean;
  finalSealSealed: boolean;
}>;

export type GovernanceProgramCompletionReportInput = Readonly<{
  generatedAt?: string;
  governanceSummary: GovernanceProgramSummary;
  completedChains: readonly GovernanceProgramChain[];
  sealedCommits: readonly GovernanceProgramSeal[];
  guarantees: GovernanceProgramGuarantees;
  documentationCoverage: readonly GovernanceProgramCoverageItem[];
  adrCoverage: readonly GovernanceProgramCoverageItem[];
  operatorWorkflowCoverage: readonly GovernanceProgramCoverageItem[];
  maintenanceTracks: readonly GovernanceProgramMaintenanceTrack[];
  reasons?: readonly string[];
  evidence?: unknown;
}>;

export type GovernanceProgramCompletionReport = Readonly<{
  programStatus: GovernanceProgramStatus;
  programHash: string;
  generatedAt: string;
  governanceSummary: GovernanceProgramSummary;
  completedChains: readonly GovernanceProgramChain[];
  sealedCommits: readonly GovernanceProgramSeal[];
  guarantees: GovernanceProgramGuarantees;
  documentationCoverage: readonly GovernanceProgramCoverageItem[];
  adrCoverage: readonly GovernanceProgramCoverageItem[];
  operatorWorkflowCoverage: readonly GovernanceProgramCoverageItem[];
  maintenanceTracks: readonly GovernanceProgramMaintenanceTrack[];
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

export const REQUIRED_GOVERNANCE_PROGRAM_CHAINS = Object.freeze([
  { chain: "Lifecycle Evidence Chain", required: true },
  { chain: "Completion Chain", required: true },
  { chain: "Bundle Chain", required: true },
  { chain: "Documentation Chain", required: true },
  { chain: "Meta-Certification Chain", required: true },
  { chain: "Review Chains", required: true },
  { chain: "Seal Chains", required: true },
] as const);

export const REQUIRED_GOVERNANCE_PROGRAM_SEALS = Object.freeze([
  { commit: "3674ed5", description: "Advisory evidence lifecycle completion bundle chain seal", required: true },
  { commit: "5b8ee3e", description: "Lifecycle documentation layer", required: true },
  { commit: "5047239", description: "Governance meta-certification", required: true },
  { commit: "44225dc", description: "Governance meta-certification review UI", required: true },
  { commit: "a1bdfcb", description: "Governance meta-certification final seal", required: true },
] as const);

export const REQUIRED_GOVERNANCE_PROGRAM_DOCUMENTS = Object.freeze([
  { item: "docs/architecture/overview.md", required: true },
  { item: "docs/architecture/lifecycle-map.md", required: true },
  { item: "docs/architecture/governance-boundaries.md", required: true },
  { item: "docs/architecture/operator-handbook.md", required: true },
  { item: "docs/architecture/verification-workflows.md", required: true },
  { item: "docs/architecture/seal-history.md", required: true },
  { item: "docs/architecture/phase-lineage.md", required: true },
] as const);

export const REQUIRED_GOVERNANCE_PROGRAM_ADRS = Object.freeze([
  { item: "docs/adr/ADR-0001-read-only-boundary.md", required: true },
  { item: "docs/adr/ADR-0002-verification-before-review.md", required: true },
  { item: "docs/adr/ADR-0003-no-live-import.md", required: true },
  { item: "docs/adr/ADR-0004-authority-containment.md", required: true },
] as const);

export const RECOMMENDED_GOVERNANCE_MAINTENANCE_TRACKS = Object.freeze([
  { track: "Documentation maintenance", optional: true, authoritative: false, runtime: false },
  { track: "ADR maintenance", optional: true, authoritative: false, runtime: false },
  { track: "Seal maintenance", optional: true, authoritative: false, runtime: false },
  { track: "Regression maintenance", optional: true, authoritative: false, runtime: false },
  { track: "Governance audit cadence", optional: true, authoritative: false, runtime: false },
  { track: "Operator handbook maintenance", optional: true, authoritative: false, runtime: false },
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

function normalizeChains(chains: readonly GovernanceProgramChain[]) {
  return Object.freeze([...chains]
    .map((chain) => Object.freeze({
      chain: chain.chain,
      required: chain.required,
      present: chain.present,
    }))
    .sort((left, right) => left.chain.localeCompare(right.chain)));
}

function normalizeSeals(seals: readonly GovernanceProgramSeal[]) {
  return Object.freeze([...seals]
    .map((seal) => Object.freeze({
      commit: seal.commit,
      description: seal.description,
      required: seal.required,
      present: seal.present,
    }))
    .sort((left, right) => left.commit.localeCompare(right.commit)));
}

function normalizeCoverage(items: readonly GovernanceProgramCoverageItem[]) {
  return Object.freeze([...items]
    .map((item) => Object.freeze({
      item: item.item,
      required: item.required,
      present: item.present,
    }))
    .sort((left, right) => left.item.localeCompare(right.item)));
}

function normalizeMaintenanceTracks(tracks: readonly GovernanceProgramMaintenanceTrack[]) {
  return Object.freeze([...tracks]
    .map((track) => Object.freeze({
      track: track.track,
      optional: track.optional,
      authoritative: track.authoritative,
      runtime: track.runtime,
      present: track.present ?? true,
    }))
    .sort((left, right) => left.track.localeCompare(right.track)));
}

function scanAuthorityLeaks(value: unknown, path = "governanceProgramEvidence"): string[] {
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

function mapByChain(chains: readonly GovernanceProgramChain[]) {
  return new Map(chains.map((chain) => [chain.chain, chain]));
}

function mapByCommit(seals: readonly GovernanceProgramSeal[]) {
  return new Map(seals.map((seal) => [seal.commit, seal]));
}

function mapByItem(items: readonly GovernanceProgramCoverageItem[]) {
  return new Map(items.map((item) => [item.item, item]));
}

function chainReasons(chains: readonly GovernanceProgramChain[]) {
  const reasons: string[] = [];
  const chainsByName = mapByChain(chains);
  for (const requiredChain of REQUIRED_GOVERNANCE_PROGRAM_CHAINS) {
    const chain = chainsByName.get(requiredChain.chain);
    if (!chain || !chain.present) reasons.push(`REQUIRED_CHAIN_MISSING:${requiredChain.chain}`);
  }
  for (const chain of chains) {
    if (chain.required && !chain.present) reasons.push(`REQUIRED_CHAIN_MISSING:${chain.chain}`);
  }
  return reasons;
}

function sealReasons(seals: readonly GovernanceProgramSeal[]) {
  const reasons: string[] = [];
  const sealsByCommit = mapByCommit(seals);
  for (const requiredSeal of REQUIRED_GOVERNANCE_PROGRAM_SEALS) {
    const seal = sealsByCommit.get(requiredSeal.commit);
    if (!seal || !seal.present) reasons.push(`REQUIRED_SEAL_MISSING:${requiredSeal.commit}`);
  }
  for (const seal of seals) {
    if (seal.required && !seal.present) reasons.push(`REQUIRED_SEAL_MISSING:${seal.commit}`);
  }
  return reasons;
}

function coverageReasons(
  coverage: readonly GovernanceProgramCoverageItem[],
  requiredItems: readonly { item: string; required: true }[],
  prefix: string,
) {
  const reasons: string[] = [];
  const coverageByItem = mapByItem(coverage);
  for (const requiredItem of requiredItems) {
    const item = coverageByItem.get(requiredItem.item);
    if (!item || !item.present) reasons.push(`${prefix}:${requiredItem.item}`);
  }
  for (const item of coverage) {
    if (item.required && !item.present) reasons.push(`${prefix}:${item.item}`);
  }
  return reasons;
}

function operatorWorkflowReasons(coverage: readonly GovernanceProgramCoverageItem[]) {
  return coverage.flatMap((item) => (item.required && !item.present
    ? [`REQUIRED_OPERATOR_WORKFLOW_MISSING:${item.item}`]
    : []));
}

function guaranteeReasons(guarantees: GovernanceProgramGuarantees) {
  const reasons: string[] = [];
  for (const [key, value] of Object.entries(guarantees)) {
    if (!value) reasons.push(`GUARANTEE_MISSING:${key}`);
  }
  return reasons;
}

function summaryReasons(summary: GovernanceProgramSummary) {
  const reasons: string[] = [];
  for (const [key, value] of Object.entries(summary)) {
    if (!value) reasons.push(`SUMMARY_GAP:${key}`);
  }
  return reasons;
}

function maintenanceTrackReasons(tracks: readonly GovernanceProgramMaintenanceTrack[]) {
  return tracks.flatMap((track) => {
    const reasons: string[] = [];
    if (track.optional && track.present === false) reasons.push(`OPTIONAL_MAINTENANCE_TRACK_PENDING:${track.track}`);
    if (track.authoritative) reasons.push(`MAINTENANCE_TRACK_AUTHORITY_LEAK:${track.track}`);
    if (track.runtime) reasons.push(`MAINTENANCE_TRACK_RUNTIME_LEAK:${track.track}`);
    return reasons;
  });
}

function statusFor(reasons: readonly string[]) {
  if (reasons.some((reason) => (
    reason.startsWith("REQUIRED_CHAIN_MISSING:")
    || reason.startsWith("REQUIRED_SEAL_MISSING:")
    || reason.startsWith("REQUIRED_DOCUMENTATION_MISSING:")
    || reason.startsWith("REQUIRED_ADR_MISSING:")
    || reason.startsWith("REQUIRED_OPERATOR_WORKFLOW_MISSING:")
  ))) {
    return "PROGRAM_FAILED" as const;
  }
  if (reasons.some((reason) => (
    reason.startsWith("CONTROL_AUTHORITY_LEAK:")
    || reason.startsWith("TRUSTED_STATE_LEAK:")
    || reason.startsWith("LIVE_IMPORT_LEAK:")
    || reason.startsWith("MAINTENANCE_TRACK_AUTHORITY_LEAK:")
    || reason.startsWith("MAINTENANCE_TRACK_RUNTIME_LEAK:")
    || reason.startsWith("GUARANTEE_MISSING:")
    || reason.startsWith("SUMMARY_GAP:")
  ))) {
    return "PROGRAM_DISPUTED" as const;
  }
  if (reasons.some((reason) => reason.startsWith("OPTIONAL_MAINTENANCE_TRACK_PENDING:"))) {
    return "PROGRAM_CONDITIONAL" as const;
  }
  return "PROGRAM_COMPLETE" as const;
}

function hashMaterial(input: {
  programStatus: GovernanceProgramStatus;
  governanceSummary: GovernanceProgramSummary;
  completedChains: readonly GovernanceProgramChain[];
  sealedCommits: readonly GovernanceProgramSeal[];
  guarantees: GovernanceProgramGuarantees;
  documentationCoverage: readonly GovernanceProgramCoverageItem[];
  adrCoverage: readonly GovernanceProgramCoverageItem[];
  operatorWorkflowCoverage: readonly GovernanceProgramCoverageItem[];
  maintenanceTracks: readonly GovernanceProgramMaintenanceTrack[];
  reasons: readonly string[];
}) {
  return {
    programStatus: input.programStatus,
    governanceSummary: input.governanceSummary,
    completedChains: input.completedChains,
    sealedCommits: input.sealedCommits,
    guarantees: input.guarantees,
    documentationCoverage: input.documentationCoverage,
    adrCoverage: input.adrCoverage,
    operatorWorkflowCoverage: input.operatorWorkflowCoverage,
    maintenanceTracks: input.maintenanceTracks,
    ...SAFE_AUTHORITY,
    reasons: input.reasons,
  };
}

export function buildGovernanceProgramCompletionReport(
  input: GovernanceProgramCompletionReportInput,
): GovernanceProgramCompletionReport {
  const generatedAt = input.generatedAt || new Date().toISOString();
  const governanceSummary = Object.freeze({ ...input.governanceSummary });
  const completedChains = normalizeChains(input.completedChains);
  const sealedCommits = normalizeSeals(input.sealedCommits);
  const guarantees = Object.freeze({ ...input.guarantees });
  const documentationCoverage = normalizeCoverage(input.documentationCoverage);
  const adrCoverage = normalizeCoverage(input.adrCoverage);
  const operatorWorkflowCoverage = normalizeCoverage(input.operatorWorkflowCoverage);
  const maintenanceTracks = normalizeMaintenanceTracks(input.maintenanceTracks);
  const reasons = normalizeReasons([
    ...chainReasons(completedChains),
    ...sealReasons(sealedCommits),
    ...coverageReasons(documentationCoverage, REQUIRED_GOVERNANCE_PROGRAM_DOCUMENTS, "REQUIRED_DOCUMENTATION_MISSING"),
    ...coverageReasons(adrCoverage, REQUIRED_GOVERNANCE_PROGRAM_ADRS, "REQUIRED_ADR_MISSING"),
    ...operatorWorkflowReasons(operatorWorkflowCoverage),
    ...guaranteeReasons(guarantees),
    ...summaryReasons(governanceSummary),
    ...maintenanceTrackReasons(maintenanceTracks),
    ...scanAuthorityLeaks(input.evidence),
    ...(input.reasons || []),
  ]);
  const programStatus = statusFor(reasons);
  const programHash = sha256(hashMaterial({
    programStatus,
    governanceSummary,
    completedChains,
    sealedCommits,
    guarantees,
    documentationCoverage,
    adrCoverage,
    operatorWorkflowCoverage,
    maintenanceTracks,
    reasons,
  }));

  return Object.freeze({
    programStatus,
    programHash,
    generatedAt,
    governanceSummary,
    completedChains,
    sealedCommits,
    guarantees,
    documentationCoverage,
    adrCoverage,
    operatorWorkflowCoverage,
    maintenanceTracks,
    ...SAFE_AUTHORITY,
    reasons,
  });
}
