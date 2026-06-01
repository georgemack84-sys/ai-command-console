import { hashPayloadDeterministically } from "../contracts/payloadHasher";

export type GovernanceSustainabilityStatus =
  | "SUSTAINABILITY_CERTIFIED"
  | "SUSTAINABILITY_CONDITIONAL"
  | "SUSTAINABILITY_DISPUTED"
  | "SUSTAINABILITY_FAILED";

export type SustainabilityDomainCoverage = Readonly<{
  coverageVisible: boolean;
  gapsVisible: boolean;
  lineagePreserved: boolean;
}>;

export type SealPreservationCoverage = Readonly<{
  sealChainCoverage: boolean;
  sealDependencyVisibility: boolean;
  sealContinuity: boolean;
  sealReplayability: boolean;
}>;

export type DocumentationSurvivability = Readonly<{
  architectureDocumentationCoverage: boolean;
  operatorHandbookCoverage: boolean;
  verificationWorkflowCoverage: boolean;
  sealHistoryPreservation: boolean;
}>;

export type AdrContinuity = Readonly<{
  adrLineagePreserved: boolean;
  appendOnlyPreserved: boolean;
  supersessionRulesPreserved: boolean;
  decisionContinuityMaintained: boolean;
  rationalePreserved: boolean;
}>;

export type ArtifactPreservation = Readonly<{
  sealedArtifactsRetained: boolean;
  deprecatedArtifactsMarked: boolean;
  lineageRetained: boolean;
  referencesRetained: boolean;
}>;

export type DriftResistance = Readonly<{
  governanceDriftExposureVisible: boolean;
  boundarySurvivability: boolean;
  authorityExpansionResistance: boolean;
  knowledgePreservation: boolean;
}>;

export type GovernanceSustainabilityTrack = Readonly<{
  track: string;
  optional: boolean;
  authoritative: boolean;
  runtime: boolean;
  present?: boolean;
}>;

export type GovernanceSustainabilityCertificationInput = Readonly<{
  generatedAt?: string;
  maintenanceCoverage: SustainabilityDomainCoverage;
  sealPreservationCoverage: SealPreservationCoverage;
  documentationSurvivability: DocumentationSurvivability;
  adrContinuity: AdrContinuity;
  artifactPreservation: ArtifactPreservation;
  driftResistance: DriftResistance;
  sustainabilityTracks: readonly GovernanceSustainabilityTrack[];
  reasons?: readonly string[];
  evidence?: unknown;
}>;

export type GovernanceSustainabilityCertification = Readonly<{
  sustainabilityStatus: GovernanceSustainabilityStatus;
  sustainabilityHash: string;
  generatedAt: string;
  maintenanceCoverage: SustainabilityDomainCoverage;
  sealPreservationCoverage: SealPreservationCoverage;
  documentationSurvivability: DocumentationSurvivability;
  adrContinuity: AdrContinuity;
  artifactPreservation: ArtifactPreservation;
  driftResistance: DriftResistance;
  maintenanceReadinessScore: number;
  preservationReadinessScore: number;
  sustainabilityTracks: readonly GovernanceSustainabilityTrack[];
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

export const RECOMMENDED_GOVERNANCE_SUSTAINABILITY_TRACKS = Object.freeze([
  { track: "Maintenance coverage review", optional: true, authoritative: false, runtime: false },
  { track: "Seal preservation review", optional: true, authoritative: false, runtime: false },
  { track: "Documentation survivability review", optional: true, authoritative: false, runtime: false },
  { track: "ADR continuity review", optional: true, authoritative: false, runtime: false },
  { track: "Artifact preservation review", optional: true, authoritative: false, runtime: false },
  { track: "Drift resistance review", optional: true, authoritative: false, runtime: false },
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

function normalizeTracks(tracks: readonly GovernanceSustainabilityTrack[]) {
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

function scanAuthorityLeaks(value: unknown, path = "governanceSustainabilityEvidence"): string[] {
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

function domainReasons(domainName: string, domain: Record<string, boolean>) {
  const reasons: string[] = [];
  for (const [key, value] of Object.entries(domain)) {
    if (!value) reasons.push(`REQUIRED_SUSTAINABILITY_DOMAIN_MISSING:${domainName}.${key}`);
  }
  return reasons;
}

function sustainabilityTrackReasons(tracks: readonly GovernanceSustainabilityTrack[]) {
  return tracks.flatMap((track) => {
    const reasons: string[] = [];
    if (track.optional && track.present === false) reasons.push(`OPTIONAL_SUSTAINABILITY_TRACK_PENDING:${track.track}`);
    if (track.authoritative) reasons.push(`SUSTAINABILITY_TRACK_AUTHORITY_LEAK:${track.track}`);
    if (track.runtime) reasons.push(`SUSTAINABILITY_TRACK_RUNTIME_LEAK:${track.track}`);
    return reasons;
  });
}

function scoreBooleanValues(...domains: readonly Record<string, boolean>[]) {
  const values = domains.flatMap((domain) => Object.values(domain));
  if (values.length === 0) return 0;
  const passed = values.filter(Boolean).length;
  return Number((passed / values.length).toFixed(4));
}

function statusFor(reasons: readonly string[]) {
  if (reasons.some((reason) => reason.startsWith("REQUIRED_SUSTAINABILITY_DOMAIN_MISSING:"))) {
    return "SUSTAINABILITY_FAILED" as const;
  }
  if (reasons.some((reason) => (
    reason.startsWith("CONTROL_AUTHORITY_LEAK:")
    || reason.startsWith("TRUSTED_STATE_LEAK:")
    || reason.startsWith("LIVE_IMPORT_LEAK:")
    || reason.startsWith("SUSTAINABILITY_TRACK_AUTHORITY_LEAK:")
    || reason.startsWith("SUSTAINABILITY_TRACK_RUNTIME_LEAK:")
  ))) {
    return "SUSTAINABILITY_DISPUTED" as const;
  }
  if (reasons.some((reason) => reason.startsWith("OPTIONAL_SUSTAINABILITY_TRACK_PENDING:"))) {
    return "SUSTAINABILITY_CONDITIONAL" as const;
  }
  return "SUSTAINABILITY_CERTIFIED" as const;
}

function hashMaterial(input: {
  sustainabilityStatus: GovernanceSustainabilityStatus;
  maintenanceCoverage: SustainabilityDomainCoverage;
  sealPreservationCoverage: SealPreservationCoverage;
  documentationSurvivability: DocumentationSurvivability;
  adrContinuity: AdrContinuity;
  artifactPreservation: ArtifactPreservation;
  driftResistance: DriftResistance;
  maintenanceReadinessScore: number;
  preservationReadinessScore: number;
  sustainabilityTracks: readonly GovernanceSustainabilityTrack[];
  reasons: readonly string[];
}) {
  return {
    sustainabilityStatus: input.sustainabilityStatus,
    maintenanceCoverage: input.maintenanceCoverage,
    sealPreservationCoverage: input.sealPreservationCoverage,
    documentationSurvivability: input.documentationSurvivability,
    adrContinuity: input.adrContinuity,
    artifactPreservation: input.artifactPreservation,
    driftResistance: input.driftResistance,
    maintenanceReadinessScore: input.maintenanceReadinessScore,
    preservationReadinessScore: input.preservationReadinessScore,
    sustainabilityTracks: input.sustainabilityTracks,
    ...SAFE_AUTHORITY,
    reasons: input.reasons,
  };
}

export function certifyGovernanceSustainability(
  input: GovernanceSustainabilityCertificationInput,
): GovernanceSustainabilityCertification {
  const generatedAt = input.generatedAt || new Date().toISOString();
  const maintenanceCoverage = Object.freeze({ ...input.maintenanceCoverage });
  const sealPreservationCoverage = Object.freeze({ ...input.sealPreservationCoverage });
  const documentationSurvivability = Object.freeze({ ...input.documentationSurvivability });
  const adrContinuity = Object.freeze({ ...input.adrContinuity });
  const artifactPreservation = Object.freeze({ ...input.artifactPreservation });
  const driftResistance = Object.freeze({ ...input.driftResistance });
  const sustainabilityTracks = normalizeTracks(input.sustainabilityTracks);
  const maintenanceReadinessScore = scoreBooleanValues(maintenanceCoverage, driftResistance);
  const preservationReadinessScore = scoreBooleanValues(
    sealPreservationCoverage,
    documentationSurvivability,
    adrContinuity,
    artifactPreservation,
  );
  const reasons = normalizeReasons([
    ...domainReasons("maintenanceCoverage", maintenanceCoverage),
    ...domainReasons("sealPreservationCoverage", sealPreservationCoverage),
    ...domainReasons("documentationSurvivability", documentationSurvivability),
    ...domainReasons("adrContinuity", adrContinuity),
    ...domainReasons("artifactPreservation", artifactPreservation),
    ...domainReasons("driftResistance", driftResistance),
    ...sustainabilityTrackReasons(sustainabilityTracks),
    ...scanAuthorityLeaks(input.evidence),
    ...(input.reasons || []),
  ]);
  const sustainabilityStatus = statusFor(reasons);
  const sustainabilityHash = sha256(hashMaterial({
    sustainabilityStatus,
    maintenanceCoverage,
    sealPreservationCoverage,
    documentationSurvivability,
    adrContinuity,
    artifactPreservation,
    driftResistance,
    maintenanceReadinessScore,
    preservationReadinessScore,
    sustainabilityTracks,
    reasons,
  }));

  return Object.freeze({
    sustainabilityStatus,
    sustainabilityHash,
    generatedAt,
    maintenanceCoverage,
    sealPreservationCoverage,
    documentationSurvivability,
    adrContinuity,
    artifactPreservation,
    driftResistance,
    maintenanceReadinessScore,
    preservationReadinessScore,
    sustainabilityTracks,
    ...SAFE_AUTHORITY,
    reasons,
  });
}
