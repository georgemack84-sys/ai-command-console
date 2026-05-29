export type ReleaseGovernanceStatus = "PASSED" | "FAILED" | "DISPUTED" | "UNKNOWN";

export type ReleaseResidueResult = "CLEAN" | "DIRTY" | "UNKNOWN";

export type ReleaseCertificateVersion = "1.0";

export type ReleaseCertificate = Readonly<{
  certificateVersion: ReleaseCertificateVersion;
  releaseId: string;
  commitSha: string;
  testHash: string;
  artifactHash: string;
  governanceStatus: ReleaseGovernanceStatus;
  residueResult: ReleaseResidueResult;
  approvalLineage: readonly string[];
  generatedAt: string;
  certificateHash: string;
}>;

export type ReleaseCertificateInput = Readonly<{
  certificateVersion?: ReleaseCertificateVersion;
  releaseId: string;
  commitSha: string;
  testHash: string;
  artifactHash: string;
  governanceStatus: ReleaseGovernanceStatus;
  residueResult: ReleaseResidueResult;
  approvalLineage: readonly string[];
  generatedAt: string;
}>;

export type ReleaseCertificateResult =
  | Readonly<{ ok: true; certificate: ReleaseCertificate }>
  | Readonly<{ ok: false; reasons: readonly string[] }>;

export type ReleaseEvidenceManifest = Readonly<{
  manifestVersion: "1.0";
  releaseId: string;
  certificateHash: string;
  generatedAt: string;
  evidenceHashes: Readonly<Record<string, string>>;
  manifestHash: string;
}>;

export type ReleaseEvidenceBundle = Readonly<{
  certificate?: ReleaseCertificate;
  manifest?: ReleaseEvidenceManifest;
  approvals?: unknown;
  governance?: unknown;
  testResults?: unknown;
  artifactHashes?: unknown;
  timeline?: unknown;
}>;

export type ReleaseReplayVerificationResult = Readonly<{
  ok: boolean;
  status: "REPLAYABLE" | "NOT_REPLAYABLE" | "DISPUTED";
  missingEvidence: readonly string[];
  hashMismatches: readonly string[];
  certificateHash: string;
}>;

export type DeployVerificationResult = Readonly<{
  ok: boolean;
  status: "VERIFIED" | "BLOCKED" | "DISPUTED";
  reasons: readonly string[];
  certificateHash: string;
  commitSha: string;
}>;
