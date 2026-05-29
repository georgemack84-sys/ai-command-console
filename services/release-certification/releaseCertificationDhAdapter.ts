import { hashReleaseValue } from "./certificate";

export type DhReleaseCertificationAdapterStatus = "COMPATIBLE" | "PARTIAL" | "DISPUTED" | "FAILED";

export type DhArtifactInput = Readonly<{
  name: string;
  data?: unknown;
  hash?: string;
}>;

export type DhArtifactMap = Readonly<Record<string, unknown>>;

export type DhReleaseCertificationSchemaMismatch = Readonly<{
  sourceField: string;
  targetField: string;
  resolution: "NORMALIZED" | "MISSING" | "INCOMPATIBLE" | "NOT_REQUIRED";
  reason: string;
}>;

export type DhReleaseCertificationMappedArtifact = Readonly<{
  sourceName: string;
  targetField: string;
  hash?: string;
  required: boolean;
  present: boolean;
}>;

export type DhReleaseCertificationAdapterResult = Readonly<{
  status: DhReleaseCertificationAdapterStatus;
  commitSha: string | null;
  certificateStatus: string | null;
  evidenceHash: string | null;
  artifactHash: string | null;
  auditCertificationHash: string | null;
  governanceReplayHash: string | null;
  mappedArtifacts: readonly DhReleaseCertificationMappedArtifact[];
  schemaMismatches: readonly DhReleaseCertificationSchemaMismatch[];
  replayEvidenceAvailable: boolean;
  authority: "READ_ONLY";
  mayBlockDeployment: false;
  mayTriggerRollback: false;
  mayTriggerRetry: false;
  reasons: readonly string[];
}>;

export type DhReleaseCertificationAdapterInput = Readonly<{
  artifacts: DhArtifactMap | readonly DhArtifactInput[];
}>;

type NormalizedArtifact = Readonly<{
  name: string;
  data: unknown;
  hash?: string;
  present: boolean;
  parseable: boolean;
}>;

const REQUIRED_ARTIFACTS = new Set([
  "certificate-verification.json",
  "deployment-evidence.json",
  "deployment-audit-certification.json",
  "deployment-governance-replay.json",
]);

const ARTIFACT_MAPPINGS = [
  ["certificate-verification.json", "certificateStatus"],
  ["deployment-evidence.json", "evidenceHash"],
  ["deployment-audit-certification.json", "auditCertificationHash"],
  ["deployment-governance-replay.json", "governanceReplayHash"],
  ["deployment-telemetry.jsonl", "telemetryEvidence"],
  ["deployment-summary.json", "deploymentSummary"],
  ["checkpoint-validation.json", "checkpointEvidence"],
  ["resume-analysis.json", "resumeEvidence"],
  ["deployment-decision.json", "decisionEvidence"],
  ["deployment-decision-summary.json", "decisionSummary"],
  ["deployment-enforcement.json", "enforcementEvidence"],
  ["deployment-enforcement-summary.json", "enforcementSummary"],
  ["deployment-override-governance.json", "overrideEvidence"],
  ["deployment-override-request.json", "overrideRequest"],
  ["deployment-override-summary.json", "overrideSummary"],
  ["deployment-lineage.json", "lineageEvidence"],
  ["deployment-certification-summary.json", "certificationSummary"],
  ["deployment-replay-lineage.json", "replayLineage"],
  ["deployment-drift-report.json", "driftReport"],
  ["deployment-replay-summary.json", "replaySummary"],
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function normalizeInput(artifacts: DhArtifactMap | readonly DhArtifactInput[]): Map<string, NormalizedArtifact> {
  const entries: readonly (readonly [string, { data: unknown; hash?: string }])[] = Array.isArray(artifacts)
    ? artifacts.map((artifact) => [artifact.name, { data: artifact.data, hash: artifact.hash }] as const)
    : Object.entries(artifacts).map(([name, data]) => [name, { data, hash: undefined }] as const);

  const normalized = new Map<string, NormalizedArtifact>();

  for (const [name, artifact] of [...entries].sort(([left], [right]) => left.localeCompare(right))) {
    if (artifact.data === undefined || artifact.data === null) {
      normalized.set(name, {
        name,
        data: artifact.data,
        hash: artifact.hash,
        present: false,
        parseable: false,
      });
      continue;
    }

    if (typeof artifact.data === "string" && name.endsWith(".json")) {
      try {
        normalized.set(name, {
          name,
          data: JSON.parse(artifact.data),
          hash: artifact.hash,
          present: true,
          parseable: true,
        });
      } catch {
        normalized.set(name, {
          name,
          data: artifact.data,
          hash: artifact.hash,
          present: true,
          parseable: false,
        });
      }
      continue;
    }

    normalized.set(name, {
      name,
      data: artifact.data,
      hash: artifact.hash,
      present: true,
      parseable: true,
    });
  }

  return normalized;
}

function artifactHash(artifact: NormalizedArtifact | undefined): string | undefined {
  if (!artifact?.present || !artifact.parseable) return artifact?.hash;
  return artifact.hash || hashReleaseValue(artifact.data);
}

function readObject(artifacts: Map<string, NormalizedArtifact>, name: string) {
  const artifact = artifacts.get(name);
  return artifact?.present && artifact.parseable && isRecord(artifact.data) ? artifact.data : null;
}

function collectCommitSha(
  artifactName: string,
  artifact: Record<string, unknown> | null,
  schemaMismatches: DhReleaseCertificationSchemaMismatch[],
) {
  if (!artifact) return null;
  const commitSha = asString(artifact.commitSha);
  if (commitSha) return commitSha;

  const commitSHA = asString(artifact.commitSHA);
  if (commitSHA) {
    schemaMismatches.push({
      sourceField: `${artifactName}.commitSHA`,
      targetField: "commitSha",
      resolution: "NORMALIZED",
      reason: "commitSHA normalized to commitSha",
    });
    return commitSHA;
  }

  return null;
}

function uniqueStrings(values: readonly (string | null)[]) {
  return [...new Set(values.filter((value): value is string => Boolean(value)))].sort();
}

function mappedArtifacts(artifacts: Map<string, NormalizedArtifact>): readonly DhReleaseCertificationMappedArtifact[] {
  return ARTIFACT_MAPPINGS
    .filter(([sourceName]) => REQUIRED_ARTIFACTS.has(sourceName) || artifacts.has(sourceName))
    .map(([sourceName, targetField]) => {
      const artifact = artifacts.get(sourceName);
      const hash = artifactHash(artifact);
      return {
        sourceName,
        targetField,
        ...(hash ? { hash } : {}),
        required: REQUIRED_ARTIFACTS.has(sourceName),
        present: Boolean(artifact?.present && artifact.parseable),
      };
    });
}

function hasHashMismatch(artifacts: Map<string, NormalizedArtifact>, reasons: string[]) {
  for (const artifact of [...artifacts.values()].sort((left, right) => left.name.localeCompare(right.name))) {
    if (!artifact.present || !artifact.parseable || !artifact.hash) continue;
    const actualHash = hashReleaseValue(artifact.data);
    if (artifact.hash !== actualHash) {
      reasons.push(`DH_ARTIFACT_HASH_MISMATCH:${artifact.name}`);
    }
  }
}

export function adaptDhArtifactsForReleaseCertification(
  input: DhReleaseCertificationAdapterInput,
): DhReleaseCertificationAdapterResult {
  const artifacts = normalizeInput(input.artifacts);
  const reasons: string[] = [];
  const schemaMismatches: DhReleaseCertificationSchemaMismatch[] = [];

  for (const name of [...REQUIRED_ARTIFACTS].sort()) {
    const artifact = artifacts.get(name);
    if (!artifact?.present) {
      reasons.push(`REQUIRED_DH_ARTIFACT_MISSING:${name}`);
    } else if (!artifact.parseable || !isRecord(artifact.data)) {
      reasons.push(`REQUIRED_DH_ARTIFACT_UNPARSEABLE:${name}`);
    }
  }

  for (const [name] of ARTIFACT_MAPPINGS) {
    const artifact = artifacts.get(name);
    if (artifact && !REQUIRED_ARTIFACTS.has(name) && !artifact.present) {
      reasons.push(`OPTIONAL_DH_ARTIFACT_MISSING:${name}`);
    }
  }

  const certificate = readObject(artifacts, "certificate-verification.json");
  const evidence = readObject(artifacts, "deployment-evidence.json");
  const audit = readObject(artifacts, "deployment-audit-certification.json");
  const replay = readObject(artifacts, "deployment-governance-replay.json");

  const commitValues = uniqueStrings([
    collectCommitSha("certificate-verification.json", certificate, schemaMismatches),
    collectCommitSha("deployment-evidence.json", evidence, schemaMismatches),
    collectCommitSha("deployment-audit-certification.json", audit, schemaMismatches),
    collectCommitSha("deployment-governance-replay.json", replay, schemaMismatches),
  ]);
  if (commitValues.length > 1) reasons.push("COMMIT_SHA_CONFLICT");

  const commitSha = commitValues[0] || null;
  if (!commitSha && REQUIRED_ARTIFACTS.size === [...REQUIRED_ARTIFACTS].filter((name) => artifacts.get(name)?.present).length) {
    schemaMismatches.push({
      sourceField: "DH.commitSha",
      targetField: "commitSha",
      resolution: "MISSING",
      reason: "Required DH evidence did not expose a commit SHA",
    });
    reasons.push("COMMIT_SHA_MISSING");
  }

  const certificateStatus = asString(certificate?.certificateStatus);
  if (certificate && !certificateStatus) {
    schemaMismatches.push({
      sourceField: "certificate-verification.json.certificateStatus",
      targetField: "certificateStatus",
      resolution: "MISSING",
      reason: "Certificate verification did not expose certificateStatus",
    });
    reasons.push("CERTIFICATE_STATUS_MISSING");
  } else if (certificateStatus && certificateStatus !== "VALID") {
    reasons.push(`CERTIFICATE_STATUS_NOT_VALID:${certificateStatus}`);
  }

  const evidenceHash = asString(evidence?.evidenceHash);
  if (evidence && !evidenceHash) {
    schemaMismatches.push({
      sourceField: "deployment-evidence.json.evidenceHash",
      targetField: "evidenceHash",
      resolution: "MISSING",
      reason: "DH deployment evidence did not expose evidenceHash",
    });
    reasons.push("EVIDENCE_HASH_MISSING");
  }

  const artifactHashValue = asString(evidence?.artifactHash) || asString(certificate?.artifactHash);
  if (!artifactHashValue && (evidence || certificate)) {
    schemaMismatches.push({
      sourceField: "deployment-evidence.json.artifactHash",
      targetField: "artifactHash",
      resolution: "MISSING",
      reason: "DH evidence did not expose a release artifact hash",
    });
    reasons.push("ARTIFACT_HASH_MISSING");
  }

  const auditCertificationHash = asString(audit?.lineageHash) || asString(audit?.evidenceHash) || artifactHash(artifacts.get("deployment-audit-certification.json")) || null;
  if (audit && !auditCertificationHash) {
    reasons.push("AUDIT_CERTIFICATION_HASH_MISSING");
  }

  const auditStatus = asString(audit?.certificationStatus);
  if (auditStatus === "FAILED") reasons.push("AUDIT_CERTIFICATION_FAILED");
  if (auditStatus === "DISPUTED") reasons.push("AUDIT_CERTIFICATION_DISPUTED");
  if (auditStatus === "PARTIAL") reasons.push("AUDIT_CERTIFICATION_PARTIAL");

  const governanceReplayHash = asString(replay?.replayHash) || artifactHash(artifacts.get("deployment-governance-replay.json")) || null;
  if (replay && !governanceReplayHash) {
    reasons.push("GOVERNANCE_REPLAY_HASH_MISSING");
  }

  const replayStatus = asString(replay?.replayStatus);
  if (replayStatus === "FAILED") reasons.push("GOVERNANCE_REPLAY_FAILED");
  if (replayStatus === "DISPUTED" || replayStatus === "DRIFTED") reasons.push(`GOVERNANCE_REPLAY_${replayStatus}`);
  if (replayStatus === "PARTIAL") reasons.push("GOVERNANCE_REPLAY_PARTIAL");

  const replayEvidenceAvailable = Boolean(replay && governanceReplayHash && replayStatus !== "FAILED");
  if (replay && !replayEvidenceAvailable) {
    reasons.push("REPLAY_EVIDENCE_UNAVAILABLE");
  }

  const certificateHashes = uniqueStrings([
    asString(certificate?.certificateHash),
    asString(audit?.certificateHash),
  ]);
  if (certificateHashes.length > 1) reasons.push("CERTIFICATE_HASH_CONFLICT");

  hasHashMismatch(artifacts, reasons);

  const hasRequiredFailure = reasons.some((reason) => (
    reason.startsWith("REQUIRED_DH_ARTIFACT_MISSING:")
    || reason.startsWith("REQUIRED_DH_ARTIFACT_UNPARSEABLE:")
    || reason === "COMMIT_SHA_MISSING"
    || reason === "CERTIFICATE_STATUS_MISSING"
    || reason === "EVIDENCE_HASH_MISSING"
    || reason === "AUDIT_CERTIFICATION_HASH_MISSING"
    || reason === "GOVERNANCE_REPLAY_HASH_MISSING"
    || reason === "GOVERNANCE_REPLAY_FAILED"
    || reason === "REPLAY_EVIDENCE_UNAVAILABLE"
  ));
  const hasDispute = reasons.some((reason) => (
    reason.includes("CONFLICT")
    || reason.includes("MISMATCH")
    || reason.startsWith("CERTIFICATE_STATUS_NOT_VALID:")
    || reason === "AUDIT_CERTIFICATION_DISPUTED"
    || reason === "GOVERNANCE_REPLAY_DISPUTED"
    || reason === "GOVERNANCE_REPLAY_DRIFTED"
  ));
  const hasPartial = reasons.some((reason) => (
    reason.startsWith("OPTIONAL_DH_ARTIFACT_MISSING:")
    || reason === "ARTIFACT_HASH_MISSING"
    || reason === "AUDIT_CERTIFICATION_PARTIAL"
    || reason === "GOVERNANCE_REPLAY_PARTIAL"
  ));

  const status: DhReleaseCertificationAdapterStatus = hasRequiredFailure
    ? "FAILED"
    : hasDispute
      ? "DISPUTED"
      : hasPartial
        ? "PARTIAL"
        : "COMPATIBLE";

  return {
    status,
    commitSha,
    certificateStatus,
    evidenceHash,
    artifactHash: artifactHashValue,
    auditCertificationHash,
    governanceReplayHash,
    mappedArtifacts: mappedArtifacts(artifacts),
    schemaMismatches,
    replayEvidenceAvailable,
    authority: "READ_ONLY",
    mayBlockDeployment: false,
    mayTriggerRollback: false,
    mayTriggerRetry: false,
    reasons: status === "COMPATIBLE" ? [] : [...new Set(reasons)].sort(),
  };
}
