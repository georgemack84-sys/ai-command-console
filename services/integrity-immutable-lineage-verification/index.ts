import { validateCertificationAndReplay } from "@/services/certification-replay-requirement-validator";
import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { createGovernanceDecisionRecord, validateGovernanceDecisionRecord } from "@/services/governance-decision-filter-contract";
import type { CertificationReplayValidatorResult } from "@/types/certification-replay-requirement-validator";
import type { GovernanceDecisionRecord } from "@/types/governance-decision-filter-contract";
import type {
  ImmutableLineageNode,
  IntegrityEvidenceReport,
  IntegrityHashAlgorithm,
  IntegrityImmutableLineageFoundation,
  IntegrityLineageFailureReason,
  IntegrityLineageLedgerRecord,
  IntegrityLineageObservability,
  IntegrityLineageReplay,
  IntegrityLineageValidation,
  IntegrityLineageVerifierInput,
  IntegrityLineageVerifierResult,
  IntegrityValidationOutcome,
  IntegrityVerificationRecord,
  IntegrityVerificationScope,
  ProtectedIntegrityArtifact,
} from "@/types/integrity-immutable-lineage-verification";

const VERIFIER_VERSION = "integrity-immutable-lineage-verification/v1" as const;
const AUTHORIZED_COMPONENT = "integrity-immutable-lineage-verification";
const NOW = "2026-07-04T00:38:00.000Z";

export const INTEGRITY_VERIFICATION_SCOPES: readonly IntegrityVerificationScope[] = Object.freeze([
  "Decision Candidate",
  "Governance Decision",
  "Constitutional Evaluation",
  "Authority Evaluation",
  "Tenant Isolation",
  "Certification Record",
  "Replay Package",
  "Evidence Collection",
  "Mission Record",
  "Lineage Chain",
  "Ledger Entry",
  "Audit Artifact",
]);

export const INTEGRITY_VALIDATION_OUTCOMES: readonly IntegrityValidationOutcome[] = Object.freeze(["VERIFIED", "PARTIAL", "CORRUPTED", "UNKNOWN"]);
const APPROVED_HASH_ALGORITHM: IntegrityHashAlgorithm = "SHA-256";

function hash(value: unknown): string {
  return generateDecisionIntegrityHash(value);
}

function hashWithoutIntegrity(value: object): string {
  const copy = { ...value } as Record<string, unknown>;
  delete copy.integrity_hash;
  return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown);
}

function hashWithoutProtectedHashes(value: object): string {
  const copy = { ...value } as Record<string, unknown>;
  delete copy.artifact_hash;
  delete copy.metadata_hash;
  delete copy.integrity_hash;
  return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown);
}

function normalize(values: readonly string[] | undefined): readonly string[] {
  return Object.freeze([...new Set((values ?? []).filter((value) => value.length > 0))].sort());
}

export function computeProtectedArtifactHash(artifact: Omit<ProtectedIntegrityArtifact, "artifact_hash" | "metadata_hash" | "integrity_hash"> | ProtectedIntegrityArtifact): string {
  return hashWithoutProtectedHashes(artifact);
}

export function computeProtectedArtifactMetadataHash(artifact: Omit<ProtectedIntegrityArtifact, "metadata_hash" | "integrity_hash"> | ProtectedIntegrityArtifact): string {
  return hash({
    artifact_ref: artifact.artifact_ref,
    artifact_type: artifact.artifact_type,
    governance_decision_id: artifact.governance_decision_id,
    mission_id: artifact.mission_id,
    tenant_id: artifact.tenant_id,
    lineage_ref: artifact.lineage_ref,
    created_at: artifact.created_at,
  });
}

function protectedArtifact(input: Omit<ProtectedIntegrityArtifact, "artifact_hash" | "metadata_hash" | "integrity_hash">): ProtectedIntegrityArtifact {
  const withArtifactHash = { ...input, artifact_hash: computeProtectedArtifactHash(input) };
  const withMetadataHash = { ...withArtifactHash, metadata_hash: computeProtectedArtifactMetadataHash(withArtifactHash) };
  return Object.freeze({ ...withMetadataHash, integrity_hash: hashWithoutIntegrity(withMetadataHash) });
}

export function createProtectedIntegrityArtifacts(
  decision: GovernanceDecisionRecord = createGovernanceDecisionRecord({ lifecycle_state: "READY_FOR_ENFORCEMENT" }),
  certification: CertificationReplayValidatorResult = validateCertificationAndReplay({ governance_decision: decision }),
): readonly ProtectedIntegrityArtifact[] {
  const baseArtifacts = [
    {
      artifact_ref: decision.decision_candidate_id,
      artifact_type: "Decision Candidate" as const,
      evidence_refs: decision.evidence_refs,
      replay_refs: decision.replay_refs,
      lineage_ref: decision.lineage_refs[0] ?? `lineage_${decision.governance_decision_id}`,
      parent_refs: [],
      child_refs: [decision.governance_decision_id],
    },
    {
      artifact_ref: decision.governance_decision_id,
      artifact_type: "Governance Decision" as const,
      evidence_refs: decision.evidence_refs,
      replay_refs: decision.replay_refs,
      lineage_ref: decision.lineage_refs[0] ?? `lineage_${decision.governance_decision_id}`,
      parent_refs: [decision.decision_candidate_id],
      child_refs: [certification.evidence_package.package_id],
    },
    {
      artifact_ref: certification.evidence_package.package_id,
      artifact_type: "Certification Record" as const,
      evidence_refs: certification.evidence_package.evidence_refs,
      replay_refs: [certification.evidence_package.replay_ref],
      lineage_ref: certification.evidence_package.certification_lineage[0] ?? `lineage_${decision.governance_decision_id}`,
      parent_refs: [decision.governance_decision_id],
      child_refs: [certification.replay_report.report_id],
    },
    {
      artifact_ref: certification.replay_report.report_id,
      artifact_type: "Replay Package" as const,
      evidence_refs: certification.evidence_package.evidence_refs,
      replay_refs: certification.replay_report.replay_references,
      lineage_ref: certification.evidence_package.certification_lineage[0] ?? `lineage_${decision.governance_decision_id}`,
      parent_refs: [certification.evidence_package.package_id],
      child_refs: certification.ledger_records.map((item) => item.ledger_id),
    },
    ...decision.evidence_refs.map((ref) => ({
      artifact_ref: ref,
      artifact_type: "Evidence Collection" as const,
      evidence_refs: [ref],
      replay_refs: [`replay_evidence_${ref}`],
      lineage_ref: decision.lineage_refs[0] ?? `lineage_${decision.governance_decision_id}`,
      parent_refs: [decision.decision_candidate_id],
      child_refs: [decision.governance_decision_id],
    })),
    ...certification.ledger_records.map((record) => ({
      artifact_ref: record.ledger_id,
      artifact_type: "Ledger Entry" as const,
      evidence_refs: record.evidence_refs,
      replay_refs: record.replay_refs,
      lineage_ref: certification.evidence_package.certification_lineage[0] ?? `lineage_${decision.governance_decision_id}`,
      parent_refs: [certification.replay_report.report_id],
      child_refs: [],
    })),
  ];
  return Object.freeze(baseArtifacts.map((item) => protectedArtifact({
    governance_decision_id: decision.governance_decision_id,
    mission_id: decision.mission_id,
    tenant_id: decision.tenant_id,
    hash_algorithm: APPROVED_HASH_ALGORITHM,
    append_only: true,
    deleted: false,
    modified: false,
    created_at: NOW,
    ...item,
  })));
}

export function computeLineageNodeHash(node: Omit<ImmutableLineageNode, "integrity_hash"> | ImmutableLineageNode): string {
  return hashWithoutIntegrity(node);
}

function lineageNode(input: Omit<ImmutableLineageNode, "integrity_hash">): ImmutableLineageNode {
  return Object.freeze({ ...input, integrity_hash: computeLineageNodeHash(input) });
}

export function createImmutableLineageNodes(artifacts: readonly ProtectedIntegrityArtifact[]): readonly ImmutableLineageNode[] {
  return Object.freeze(artifacts.map((artifact, index) => lineageNode({
    lineage_id: `immutable_lineage_${String(index + 1).padStart(3, "0")}_${hash(artifact.artifact_ref).slice(0, 12)}`,
    artifact_ref: artifact.artifact_ref,
    parent_lineage_ids: index === 0 ? [] : [`immutable_lineage_${String(index).padStart(3, "0")}_${hash(artifacts[index - 1]!.artifact_ref).slice(0, 12)}`],
    child_lineage_ids: index === artifacts.length - 1 ? [] : [`immutable_lineage_${String(index + 2).padStart(3, "0")}_${hash(artifacts[index + 1]!.artifact_ref).slice(0, 12)}`],
    sequence: index + 1,
    transformation_ref: `transformation_${artifact.artifact_ref}`,
    validation_ref: `validation_${artifact.artifact_ref}`,
    certification_ref: `certification_${artifact.governance_decision_id}`,
    replay_ref: artifact.replay_refs[0] ?? `replay_${artifact.artifact_ref}`,
    append_only: true,
    deleted: false,
    created_at: NOW,
  })));
}

function artifactFailures(artifacts: readonly ProtectedIntegrityArtifact[], decision: GovernanceDecisionRecord): readonly IntegrityLineageFailureReason[] {
  const failures: IntegrityLineageFailureReason[] = [];
  if (artifacts.length === 0) failures.push("MISSING_ARTIFACT");
  for (const artifact of artifacts) {
    if (!artifact.artifact_ref) failures.push("MISSING_ARTIFACT");
    if (!artifact.artifact_hash || !artifact.metadata_hash || !artifact.integrity_hash) failures.push("MISSING_HASH");
    if (artifact.hash_algorithm !== APPROVED_HASH_ALGORITHM) failures.push("UNSUPPORTED_HASH_ALGORITHM");
    if (artifact.tenant_id !== decision.tenant_id || artifact.mission_id !== decision.mission_id || artifact.governance_decision_id !== decision.governance_decision_id) failures.push("TENANT_SCOPE_MISMATCH");
    if (computeProtectedArtifactHash(artifact) !== artifact.artifact_hash || computeProtectedArtifactMetadataHash(artifact) !== artifact.metadata_hash || hashWithoutIntegrity(artifact) !== artifact.integrity_hash) failures.push("HASH_MISMATCH");
    if (!artifact.append_only || artifact.deleted || artifact.modified) failures.push("CORRUPTED_METADATA");
    if (artifact.evidence_refs.length === 0) failures.push("INCONSISTENT_EVIDENCE");
    if (artifact.replay_refs.length === 0 || !artifact.lineage_ref) failures.push("BROKEN_REFERENCE");
  }
  const evidenceRefs = normalize(artifacts.flatMap((artifact) => [...artifact.evidence_refs]));
  if (!decision.evidence_refs.every((ref) => evidenceRefs.includes(ref))) failures.push("INCONSISTENT_EVIDENCE");
  return Object.freeze([...new Set(failures)] as IntegrityLineageFailureReason[]);
}

function lineageFailures(nodes: readonly ImmutableLineageNode[], artifacts: readonly ProtectedIntegrityArtifact[]): readonly IntegrityLineageFailureReason[] {
  const failures: IntegrityLineageFailureReason[] = [];
  if (nodes.length === 0) failures.push("INCOMPLETE_LINEAGE");
  const ids = nodes.map((node) => node.lineage_id);
  if (new Set(ids).size !== ids.length) failures.push("DUPLICATE_LINEAGE_IDENTIFIER");
  if (!nodes.every((node, index) => node.sequence === index + 1)) failures.push("INCOMPLETE_LINEAGE");
  const artifactRefs = new Set(artifacts.map((artifact) => artifact.artifact_ref));
  for (const node of nodes) {
    if (!artifactRefs.has(node.artifact_ref)) failures.push("BROKEN_REFERENCE");
    if (!node.append_only || node.deleted) failures.push("CORRUPTED_METADATA");
    if (!node.replay_ref || !node.validation_ref || !node.transformation_ref) failures.push("BROKEN_REFERENCE");
    if (computeLineageNodeHash(node) !== node.integrity_hash) failures.push("HASH_MISMATCH");
    if (node.parent_lineage_ids.includes(node.lineage_id) || node.child_lineage_ids.includes(node.lineage_id)) failures.push("CIRCULAR_LINEAGE");
    if (node.parent_lineage_ids.some((id) => !ids.includes(id)) || node.child_lineage_ids.some((id) => !ids.includes(id))) failures.push("BROKEN_REFERENCE");
  }
  if (nodes.length !== artifacts.length) failures.push("INCOMPLETE_LINEAGE");
  return Object.freeze([...new Set(failures)] as IntegrityLineageFailureReason[]);
}

function validationResult(failures: readonly IntegrityLineageFailureReason[]): IntegrityLineageValidation {
  const unique = Object.freeze([...new Set(failures)] as IntegrityLineageFailureReason[]);
  const has = (failure: IntegrityLineageFailureReason) => unique.includes(failure);
  return Object.freeze({
    validation_state: unique.length === 0 ? "VALID" : "FAILED_CLOSED",
    fail_closed: unique.length > 0,
    failures: unique,
    checks: Object.freeze({
      artifacts_present: !has("MISSING_ARTIFACT"),
      hashes_present: !has("MISSING_HASH"),
      hash_algorithm_supported: !has("UNSUPPORTED_HASH_ALGORITHM"),
      hashes_reproducible: !has("HASH_MISMATCH"),
      metadata_consistent: !has("CORRUPTED_METADATA"),
      evidence_consistent: !has("INCONSISTENT_EVIDENCE"),
      references_valid: !has("BROKEN_REFERENCE"),
      lineage_complete: !has("INCOMPLETE_LINEAGE") && !has("DUPLICATE_LINEAGE_IDENTIFIER"),
      lineage_immutable: !has("CORRUPTED_METADATA"),
      lineage_acyclic: !has("CIRCULAR_LINEAGE"),
      replay_verified: !has("REPLAY_MISMATCH") && !has("CERTIFICATION_REPLAY_INVALID"),
    }),
  });
}

function outcomeFor(failures: readonly IntegrityLineageFailureReason[]): IntegrityValidationOutcome {
  if (failures.some((failure) => failure === "MISSING_ARTIFACT" || failure === "MISSING_HASH" || failure === "UNAUTHORIZED_INTEGRITY_LINEAGE_ACCESS")) return "UNKNOWN";
  if (failures.some((failure) => failure === "HASH_MISMATCH" || failure === "CORRUPTED_METADATA" || failure === "CIRCULAR_LINEAGE" || failure === "UNSUPPORTED_HASH_ALGORITHM")) return "CORRUPTED";
  if (failures.length > 0) return "PARTIAL";
  return "VERIFIED";
}

function verificationHash(record: Omit<IntegrityVerificationRecord, "integrity_hash"> | IntegrityVerificationRecord): string {
  return hashWithoutIntegrity(record);
}

function buildVerificationRecord(
  decision: GovernanceDecisionRecord,
  artifacts: readonly ProtectedIntegrityArtifact[],
  nodes: readonly ImmutableLineageNode[],
  failures: readonly IntegrityLineageFailureReason[],
): IntegrityVerificationRecord {
  const base: Omit<IntegrityVerificationRecord, "integrity_hash"> = {
    integrity_verification_id: `integrity_verification_${decision.governance_decision_id}`,
    governance_decision_id: decision.governance_decision_id,
    mission_id: decision.mission_id,
    tenant_id: decision.tenant_id,
    verification_scope: "Governance Decision",
    artifact_refs: artifacts.map((artifact) => artifact.artifact_ref),
    lineage_refs: nodes.map((node) => node.lineage_id),
    evidence_refs: normalize(artifacts.flatMap((artifact) => [...artifact.evidence_refs])),
    integrity_hashes: artifacts.flatMap((artifact) => [artifact.artifact_hash, artifact.metadata_hash, artifact.integrity_hash]),
    hash_algorithm: APPROVED_HASH_ALGORITHM,
    verification_result: outcomeFor(failures),
    corruption_findings: failures,
    consistency_results: failures.length === 0 ? ["consistent"] : failures.map((failure) => `failed:${failure}`),
    replay_ref: `replay_integrity_lineage_${decision.governance_decision_id}`,
    created_at: NOW,
  };
  return Object.freeze({ ...base, integrity_hash: verificationHash(base) });
}

function reportHash(report: Omit<IntegrityEvidenceReport, "integrity_hash"> | IntegrityEvidenceReport): string {
  return hashWithoutIntegrity(report);
}

function buildReport(record: IntegrityVerificationRecord, artifacts: readonly ProtectedIntegrityArtifact[], nodes: readonly ImmutableLineageNode[]): IntegrityEvidenceReport {
  const base: Omit<IntegrityEvidenceReport, "integrity_hash"> = {
    report_id: `integrity_evidence_report_${record.governance_decision_id}`,
    governance_decision_id: record.governance_decision_id,
    verified_artifacts: artifacts.map((artifact) => artifact.artifact_ref),
    verified_hashes: record.integrity_hashes,
    lineage_results: nodes.map((node) => `${node.lineage_id}:${node.sequence}`),
    consistency_results: record.consistency_results,
    corruption_findings: record.corruption_findings,
    validation_outcome: record.verification_result,
    evidence_refs: record.evidence_refs,
    replay_ref: record.replay_ref,
  };
  return Object.freeze({ ...base, integrity_hash: reportHash(base) });
}

function ledgerHash(record: Omit<IntegrityLineageLedgerRecord, "integrity_hash"> | IntegrityLineageLedgerRecord): string {
  return hashWithoutIntegrity(record);
}

function writeLedger(record: IntegrityVerificationRecord, report: IntegrityEvidenceReport): readonly IntegrityLineageLedgerRecord[] {
  const base: Omit<IntegrityLineageLedgerRecord, "integrity_hash"> = {
    ledger_id: `integrity_lineage_ledger_${record.governance_decision_id}`,
    governance_decision_id: record.governance_decision_id,
    verification_scope: record.verification_scope,
    artifact_results: record.artifact_refs,
    hash_results: record.integrity_hashes,
    lineage_results: record.lineage_refs,
    consistency_results: report.consistency_results,
    corruption_results: report.corruption_findings,
    validation_outcome: report.validation_outcome,
    evidence_refs: report.evidence_refs,
    replay_refs: [report.replay_ref],
    created_at: NOW,
  };
  return Object.freeze([Object.freeze({ ...base, integrity_hash: ledgerHash(base) })]);
}

function resultReplayHash(result: Omit<IntegrityLineageVerifierResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    governance_decision: result.governance_decision,
    certification_replay_result: result.certification_replay_result,
    protected_artifacts: result.protected_artifacts,
    lineage_nodes: result.lineage_nodes,
    verification_record: result.verification_record,
    evidence_report: result.evidence_report,
    ledger_records: result.ledger_records,
    validation: result.validation,
    failures: result.failures,
  });
}

function failResult(
  decision: GovernanceDecisionRecord,
  certification: CertificationReplayValidatorResult,
  failures: readonly IntegrityLineageFailureReason[],
  artifacts: readonly ProtectedIntegrityArtifact[] = [],
  nodes: readonly ImmutableLineageNode[] = [],
): IntegrityLineageVerifierResult {
  const validation = validationResult(failures);
  const verification_record = buildVerificationRecord(decision, artifacts, nodes, validation.failures);
  const evidence_report = buildReport(verification_record, artifacts, nodes);
  const base: Omit<IntegrityLineageVerifierResult, "integrity_hash" | "replay_hash"> = {
    integrity_lineage_status: "FAIL",
    fail_closed: true,
    governance_decision: decision,
    certification_replay_result: certification,
    protected_artifacts: artifacts,
    lineage_nodes: nodes,
    verification_record,
    evidence_report,
    ledger_records: Object.freeze([]),
    validation,
    validation_outcome: verification_record.verification_result,
    failures: validation.failures,
    deterministic: true,
    advisory_only: true,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: hashWithoutIntegrity({ ...base, replay_hash }) });
}

export function verifyIntegrityAndImmutableLineage(input: IntegrityLineageVerifierInput = {}): IntegrityLineageVerifierResult {
  const decision = input.governance_decision ?? createGovernanceDecisionRecord({ lifecycle_state: "READY_FOR_ENFORCEMENT" });
  const certification = input.certification_replay_result ?? validateCertificationAndReplay({ governance_decision: decision });
  if (input.authorized_component && input.authorized_component !== AUTHORIZED_COMPONENT) return failResult(decision, certification, ["UNAUTHORIZED_INTEGRITY_LINEAGE_ACCESS"]);
  const contractValidation = validateGovernanceDecisionRecord(decision);
  const artifacts = Object.freeze([...(input.protected_artifacts ?? createProtectedIntegrityArtifacts(decision, certification))].sort((a, b) => a.artifact_ref.localeCompare(b.artifact_ref)));
  const nodes = Object.freeze([...(input.lineage_nodes ?? createImmutableLineageNodes(artifacts))].sort((a, b) => a.sequence - b.sequence || a.lineage_id.localeCompare(b.lineage_id)));
  const failures: IntegrityLineageFailureReason[] = [
    ...(contractValidation.validation_state !== "VALID" ? ["GOVERNANCE_CONTRACT_INVALID" as const] : []),
    ...(certification.certification_replay_status !== "PASS" ? ["CERTIFICATION_REPLAY_INVALID" as const] : []),
    ...artifactFailures(artifacts, decision),
    ...lineageFailures(nodes, artifacts),
  ];
  const verification_record = buildVerificationRecord(decision, artifacts, nodes, failures);
  const evidence_report = buildReport(verification_record, artifacts, nodes);
  const ledger_records = writeLedger(verification_record, evidence_report);
  if (ledger_records.some((record) => ledgerHash(record) !== record.integrity_hash)) failures.push("CORRUPTED_METADATA");
  const validation = validationResult(failures);
  const finalRecord = buildVerificationRecord(decision, artifacts, nodes, validation.failures);
  const finalReport = buildReport(finalRecord, artifacts, nodes);
  const finalLedger = writeLedger(finalRecord, finalReport);
  const base: Omit<IntegrityLineageVerifierResult, "integrity_hash" | "replay_hash"> = {
    integrity_lineage_status: validation.validation_state === "VALID" ? "PASS" : "FAIL",
    fail_closed: validation.fail_closed,
    governance_decision: decision,
    certification_replay_result: certification,
    protected_artifacts: artifacts,
    lineage_nodes: nodes,
    verification_record: finalRecord,
    evidence_report: finalReport,
    ledger_records: finalLedger,
    validation,
    validation_outcome: finalRecord.verification_result,
    failures: validation.failures,
    deterministic: true,
    advisory_only: true,
  };
  const replay_hash = resultReplayHash(base);
  if (input.replay_expected_hash && input.replay_expected_hash !== replay_hash) return failResult(decision, certification, ["REPLAY_MISMATCH"], artifacts, nodes);
  return Object.freeze({ ...base, replay_hash, integrity_hash: hashWithoutIntegrity({ ...base, replay_hash }) });
}

export function replayIntegrityLineageVerification(result: IntegrityLineageVerifierResult): IntegrityLineageReplay {
  const reconstructed = resultReplayHash(result);
  const replay_valid = reconstructed === result.replay_hash
    && result.protected_artifacts.every((artifact) => computeProtectedArtifactHash(artifact) === artifact.artifact_hash)
    && result.protected_artifacts.every((artifact) => computeProtectedArtifactMetadataHash(artifact) === artifact.metadata_hash)
    && result.lineage_nodes.every((node) => computeLineageNodeHash(node) === node.integrity_hash)
    && verificationHash(result.verification_record) === result.verification_record.integrity_hash
    && reportHash(result.evidence_report) === result.evidence_report.integrity_hash
    && result.ledger_records.every((record) => ledgerHash(record) === record.integrity_hash);
  const failures: IntegrityLineageFailureReason[] = replay_valid ? [] : ["REPLAY_MISMATCH"];
  const base: Omit<IntegrityLineageReplay, "integrity_hash"> = {
    replay_id: "replay_integrity_immutable_lineage_verification",
    replay_valid,
    governance_decision_id: result.governance_decision.governance_decision_id,
    artifact_refs: result.protected_artifacts.map((artifact) => artifact.artifact_ref),
    lineage_refs: result.lineage_nodes.map((node) => node.lineage_id),
    evidence_report_ref: result.evidence_report.report_id,
    ledger_refs: result.ledger_records.map((record) => record.ledger_id),
    expected_replay_hash: result.replay_hash,
    reconstructed_replay_hash: reconstructed,
    failures: Object.freeze(failures),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

export function buildIntegrityLineageObservability(result: IntegrityLineageVerifierResult): IntegrityLineageObservability {
  return Object.freeze({
    integrity_verification_events: result.verification_record.artifact_refs.length,
    hash_verification_events: result.verification_record.integrity_hashes.length,
    evidence_consistency_events: result.evidence_report.evidence_refs.length,
    reference_validation_events: result.protected_artifacts.reduce((count, artifact) => count + artifact.replay_refs.length + (artifact.lineage_ref ? 1 : 0), 0),
    lineage_verification_events: result.lineage_nodes.length,
    corruption_detection_events: result.failures.filter((failure) => failure === "HASH_MISMATCH" || failure === "CORRUPTED_METADATA" || failure === "CIRCULAR_LINEAGE").length,
    validation_completion_events: 1,
    replay_verification_events: replayIntegrityLineageVerification(result).replay_valid ? 1 : 0,
    ledger_append_events: result.ledger_records.length,
  });
}

export function getIntegrityImmutableLineageFoundation(): IntegrityImmutableLineageFoundation {
  const result = verifyIntegrityAndImmutableLineage();
  const replay = replayIntegrityLineageVerification(result);
  return Object.freeze({
    verifier_version: VERIFIER_VERSION,
    verification_scopes: INTEGRITY_VERIFICATION_SCOPES,
    validation_outcomes: INTEGRITY_VALIDATION_OUTCOMES,
    result,
    replay,
    observability: buildIntegrityLineageObservability(result),
  });
}

export const IntegrityImmutableLineageVerification = Object.freeze({
  artifacts: createProtectedIntegrityArtifacts,
  lineage: createImmutableLineageNodes,
  verify: verifyIntegrityAndImmutableLineage,
  replay: replayIntegrityLineageVerification,
});
