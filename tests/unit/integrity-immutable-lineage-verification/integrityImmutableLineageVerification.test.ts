import { describe, expect, it } from "vitest";
import { validateCertificationAndReplay } from "@/services/certification-replay-requirement-validator";
import { createGovernanceDecisionRecord } from "@/services/governance-decision-filter-contract";
import {
  INTEGRITY_VALIDATION_OUTCOMES,
  INTEGRITY_VERIFICATION_SCOPES,
  computeLineageNodeHash,
  computeProtectedArtifactHash,
  computeProtectedArtifactMetadataHash,
  createImmutableLineageNodes,
  createProtectedIntegrityArtifacts,
  getIntegrityImmutableLineageFoundation,
  replayIntegrityLineageVerification,
  verifyIntegrityAndImmutableLineage,
} from "@/services/integrity-immutable-lineage-verification";

describe("Mission Control Phase 9.7.7 Integrity & Immutable Lineage Verification", () => {
  it("publishes the integrity immutable lineage foundation", () => {
    const foundation = getIntegrityImmutableLineageFoundation();

    expect(foundation.verifier_version).toBe("integrity-immutable-lineage-verification/v1");
    expect(foundation.verification_scopes).toEqual(INTEGRITY_VERIFICATION_SCOPES);
    expect(foundation.validation_outcomes).toEqual(INTEGRITY_VALIDATION_OUTCOMES);
    expect(foundation.result.integrity_lineage_status).toBe("PASS");
    expect(foundation.replay.replay_valid).toBe(true);
    expect(foundation.observability.ledger_append_events).toBe(1);
  });

  it("verifies protected artifacts, hashes, evidence, references, and lineage deterministically", () => {
    const first = verifyIntegrityAndImmutableLineage();
    const second = verifyIntegrityAndImmutableLineage();

    expect(first).toEqual(second);
    expect(first.validation_outcome).toBe("VERIFIED");
    expect(first.fail_closed).toBe(false);
    expect(first.evidence_report.validation_outcome).toBe("VERIFIED");
    expect(first.ledger_records).toHaveLength(1);
  });

  it("rejects missing artifacts, hashes, unsupported algorithms, and hash mismatches", () => {
    const decision = createGovernanceDecisionRecord({ lifecycle_state: "READY_FOR_ENFORCEMENT" });
    const certification = validateCertificationAndReplay({ governance_decision: decision });
    const artifacts = createProtectedIntegrityArtifacts(decision, certification);
    const missingHash = [{ ...artifacts[0], artifact_hash: "", integrity_hash: computeProtectedArtifactHash({ ...artifacts[0], artifact_hash: "" }) }];
    const badAlgorithm = [{ ...artifacts[0], hash_algorithm: "MD5" as never, artifact_hash: computeProtectedArtifactHash({ ...artifacts[0], hash_algorithm: "MD5" as never }) }];
    const tampered = [{ ...artifacts[0], artifact_ref: "tampered", metadata_hash: computeProtectedArtifactMetadataHash({ ...artifacts[0], artifact_ref: "tampered" }) }];

    expect(verifyIntegrityAndImmutableLineage({ governance_decision: decision, certification_replay_result: certification, protected_artifacts: [] }).failures).toContain("MISSING_ARTIFACT");
    expect(verifyIntegrityAndImmutableLineage({ governance_decision: decision, certification_replay_result: certification, protected_artifacts: missingHash }).failures).toContain("MISSING_HASH");
    expect(verifyIntegrityAndImmutableLineage({ governance_decision: decision, certification_replay_result: certification, protected_artifacts: badAlgorithm }).failures).toContain("UNSUPPORTED_HASH_ALGORITHM");
    expect(verifyIntegrityAndImmutableLineage({ governance_decision: decision, certification_replay_result: certification, protected_artifacts: tampered }).failures).toContain("HASH_MISMATCH");
  });

  it("rejects corrupted metadata, inconsistent evidence, broken references, and tenant scope mismatches", () => {
    const decision = createGovernanceDecisionRecord({ lifecycle_state: "READY_FOR_ENFORCEMENT" });
    const certification = validateCertificationAndReplay({ governance_decision: decision });
    const artifacts = createProtectedIntegrityArtifacts(decision, certification);
    const corrupted = [{ ...artifacts[0], modified: true, integrity_hash: computeProtectedArtifactHash({ ...artifacts[0], modified: true }) }];
    const noEvidence = [{ ...artifacts[0], evidence_refs: [], artifact_hash: computeProtectedArtifactHash({ ...artifacts[0], evidence_refs: [] }) }];
    const brokenRef = [{ ...artifacts[0], replay_refs: [], artifact_hash: computeProtectedArtifactHash({ ...artifacts[0], replay_refs: [] }) }];
    const wrongTenant = [{ ...artifacts[0], tenant_id: "tenant_beta", artifact_hash: computeProtectedArtifactHash({ ...artifacts[0], tenant_id: "tenant_beta" }) }];

    expect(verifyIntegrityAndImmutableLineage({ governance_decision: decision, certification_replay_result: certification, protected_artifacts: corrupted }).failures).toContain("CORRUPTED_METADATA");
    expect(verifyIntegrityAndImmutableLineage({ governance_decision: decision, certification_replay_result: certification, protected_artifacts: noEvidence }).failures).toContain("INCONSISTENT_EVIDENCE");
    expect(verifyIntegrityAndImmutableLineage({ governance_decision: decision, certification_replay_result: certification, protected_artifacts: brokenRef }).failures).toContain("BROKEN_REFERENCE");
    expect(verifyIntegrityAndImmutableLineage({ governance_decision: decision, certification_replay_result: certification, protected_artifacts: wrongTenant }).failures).toContain("TENANT_SCOPE_MISMATCH");
  });

  it("rejects incomplete, duplicate, circular, and broken lineage", () => {
    const result = verifyIntegrityAndImmutableLineage();
    const artifacts = result.protected_artifacts;
    const nodes = createImmutableLineageNodes(artifacts);
    const duplicate = [nodes[0], nodes[0]];
    const circular = [{ ...nodes[0], parent_lineage_ids: [nodes[0]!.lineage_id], integrity_hash: computeLineageNodeHash({ ...nodes[0]!, parent_lineage_ids: [nodes[0]!.lineage_id] }) }];
    const broken = [{ ...nodes[0], child_lineage_ids: ["missing"], integrity_hash: computeLineageNodeHash({ ...nodes[0]!, child_lineage_ids: ["missing"] }) }];

    expect(verifyIntegrityAndImmutableLineage({ protected_artifacts: artifacts, lineage_nodes: [] }).failures).toContain("INCOMPLETE_LINEAGE");
    expect(verifyIntegrityAndImmutableLineage({ protected_artifacts: artifacts, lineage_nodes: duplicate }).failures).toContain("DUPLICATE_LINEAGE_IDENTIFIER");
    expect(verifyIntegrityAndImmutableLineage({ protected_artifacts: artifacts, lineage_nodes: circular }).failures).toContain("CIRCULAR_LINEAGE");
    expect(verifyIntegrityAndImmutableLineage({ protected_artifacts: artifacts, lineage_nodes: broken }).failures).toContain("BROKEN_REFERENCE");
  });

  it("rejects invalid upstream certification, unauthorized access, and replay mismatches", () => {
    const valid = verifyIntegrityAndImmutableLineage();
    const badCertification = { ...valid.certification_replay_result, certification_replay_status: "FAIL" as const };

    expect(verifyIntegrityAndImmutableLineage({ certification_replay_result: badCertification }).failures).toContain("CERTIFICATION_REPLAY_INVALID");
    expect(verifyIntegrityAndImmutableLineage({ authorized_component: "unknown" }).failures).toContain("UNAUTHORIZED_INTEGRITY_LINEAGE_ACCESS");
    expect(verifyIntegrityAndImmutableLineage({ replay_expected_hash: `${valid.replay_hash}_wrong` }).failures).toContain("REPLAY_MISMATCH");
  });

  it("replays integrity evidence reports and lineage ledgers deterministically", () => {
    const result = verifyIntegrityAndImmutableLineage();
    const replay = replayIntegrityLineageVerification(result);
    const tampered = replayIntegrityLineageVerification({ ...result, replay_hash: "tampered" });

    expect(replay.replay_valid).toBe(true);
    expect(replay.artifact_refs).toEqual(result.protected_artifacts.map((artifact) => artifact.artifact_ref));
    expect(replay.lineage_refs).toEqual(result.lineage_nodes.map((node) => node.lineage_id));
    expect(tampered.replay_valid).toBe(false);
    expect(tampered.failures).toContain("REPLAY_MISMATCH");
  });
});
