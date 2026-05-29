import { hashReleaseValue, validateIssuedReleaseCertificate } from "./certificate";
import type { ReleaseEvidenceBundle, ReleaseEvidenceManifest, ReleaseReplayVerificationResult } from "./types";

export const RELEASE_EVIDENCE_PATHS = Object.freeze({
  certificate: "certificate.json",
  manifest: "manifest.json",
  approvals: "approvals.json",
  governance: "governance.json",
  testResults: "test-results/",
  artifactHashes: "artifact-hashes.json",
  timeline: "timeline.json",
});

const EVIDENCE_FIELDS = [
  ["certificate", RELEASE_EVIDENCE_PATHS.certificate],
  ["approvals", RELEASE_EVIDENCE_PATHS.approvals],
  ["governance", RELEASE_EVIDENCE_PATHS.governance],
  ["testResults", RELEASE_EVIDENCE_PATHS.testResults],
  ["artifactHashes", RELEASE_EVIDENCE_PATHS.artifactHashes],
  ["timeline", RELEASE_EVIDENCE_PATHS.timeline],
] as const;

function buildManifestHashPreimage(manifest: Omit<ReleaseEvidenceManifest, "manifestHash">) {
  return {
    manifestVersion: manifest.manifestVersion,
    releaseId: manifest.releaseId,
    certificateHash: manifest.certificateHash,
    generatedAt: manifest.generatedAt,
    evidenceHashes: manifest.evidenceHashes,
  } as const;
}

function hashManifest(manifest: Omit<ReleaseEvidenceManifest, "manifestHash">) {
  return hashReleaseValue(buildManifestHashPreimage(manifest));
}

function hasEvidence(value: unknown) {
  return value !== null && value !== undefined;
}

export function buildReleaseEvidenceBundle({
  certificate,
  approvals,
  governance,
  testResults,
  artifactHashes,
  timeline,
  generatedAt,
}: Required<Omit<ReleaseEvidenceBundle, "manifest">> & { generatedAt: string }): ReleaseEvidenceBundle {
  const evidence = {
    certificate,
    approvals,
    governance,
    testResults,
    artifactHashes,
    timeline,
  } as const;

  const evidenceHashes = Object.fromEntries(
    EVIDENCE_FIELDS.map(([field, path]) => [path, hashReleaseValue(evidence[field])]),
  );
  const manifestBase = {
    manifestVersion: "1.0" as const,
    releaseId: certificate.releaseId,
    certificateHash: certificate.certificateHash,
    generatedAt,
    evidenceHashes,
  };

  return Object.freeze({
    ...evidence,
    manifest: Object.freeze({
      ...manifestBase,
      manifestHash: hashManifest(manifestBase),
    }),
  });
}

export function verifyReleaseReplayBundle(bundle?: ReleaseEvidenceBundle): ReleaseReplayVerificationResult {
  if (!bundle) {
    return {
      ok: false,
      status: "DISPUTED",
      missingEvidence: ["release-evidence/"],
      hashMismatches: [],
      certificateHash: "",
    };
  }

  const missingEvidence: string[] = [];
  const hashMismatches: string[] = [];
  const certificateHash = bundle.certificate?.certificateHash || bundle.manifest?.certificateHash || "";

  if (!bundle.manifest) {
    missingEvidence.push(RELEASE_EVIDENCE_PATHS.manifest);
  }

  for (const [field, filePath] of EVIDENCE_FIELDS) {
    if (!hasEvidence(bundle[field])) {
      missingEvidence.push(filePath);
    }
  }

  if (bundle.certificate) {
    if (validateIssuedReleaseCertificate(bundle.certificate).length > 0) {
      hashMismatches.push(RELEASE_EVIDENCE_PATHS.certificate);
    }
  }

  if (bundle.manifest) {
    const expectedManifestHash = hashManifest({
      manifestVersion: bundle.manifest.manifestVersion,
      releaseId: bundle.manifest.releaseId,
      certificateHash: bundle.manifest.certificateHash,
      generatedAt: bundle.manifest.generatedAt,
      evidenceHashes: bundle.manifest.evidenceHashes,
    });
    if (expectedManifestHash !== bundle.manifest.manifestHash) {
      hashMismatches.push(RELEASE_EVIDENCE_PATHS.manifest);
    }
    if (bundle.certificate && bundle.manifest.certificateHash !== bundle.certificate.certificateHash) {
      hashMismatches.push(RELEASE_EVIDENCE_PATHS.certificate);
    }

    for (const [field, filePath] of EVIDENCE_FIELDS) {
      if (!hasEvidence(bundle[field])) {
        continue;
      }
      const expectedHash = bundle.manifest.evidenceHashes[filePath];
      if (!expectedHash || expectedHash !== hashReleaseValue(bundle[field])) {
        hashMismatches.push(filePath);
      }
    }
  }

  const uniqueMissing = [...new Set(missingEvidence)];
  const uniqueMismatches = [...new Set(hashMismatches)];
  const ok = uniqueMissing.length === 0 && uniqueMismatches.length === 0;

  return {
    ok,
    status: ok ? "REPLAYABLE" : uniqueMismatches.length > 0 ? "DISPUTED" : "NOT_REPLAYABLE",
    missingEvidence: uniqueMissing,
    hashMismatches: uniqueMismatches,
    certificateHash,
  };
}
