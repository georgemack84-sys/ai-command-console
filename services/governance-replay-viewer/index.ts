import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { runGovernanceQueryCertification } from "@/services/governance-query-certification";
import type {
  GovernanceReplayArtifact,
  GovernanceReplayComparison,
  GovernanceReplayMismatchSeverity,
  GovernanceReplayStage,
  GovernanceReplayTimelineEvent,
  GovernanceReplayVerification,
  GovernanceReplayViewerAction,
  GovernanceReplayViewerInput,
  GovernanceReplayViewerObservabilitySurface,
  GovernanceReplayViewerState,
  GovernanceReplayViewerView,
} from "@/types/governance-replay-viewer";

const NOW = "2026-06-27T15:30:00.000Z";
const SCHEMA_VERSION = "governance-replay-viewer/v7K.2" as const;
const STAGES: readonly GovernanceReplayStage[] = [
  "REPLAY_INITIALIZATION",
  "INPUT_LOADING",
  "POLICY_RECONSTRUCTION",
  "RISK_RECONSTRUCTION",
  "COMPLIANCE_RECONSTRUCTION",
  "RECOMMENDATION_RECONSTRUCTION",
  "ESCALATION_RECONSTRUCTION",
  "OUTPUT_VERIFICATION",
  "INTEGRITY_VERIFICATION",
  "CERTIFICATION_VALIDATION",
  "REPLAY_COMPLETION",
];

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function artifact(type: GovernanceReplayArtifact["artifact_type"], title: string, state: GovernanceReplayArtifact["state"], seed: string): GovernanceReplayArtifact {
  const source = {
    artifact_id: `grv:7k2:${type.toLowerCase()}:${seed}`,
    artifact_type: type,
    title,
    state,
    evidence_refs: freezeArray([`evidence:7k2:${seed}`, "evidence:7j5:query-certification"]),
    lineage_refs: freezeArray([`lineage:7k2:${seed}`]),
    explanation: `${title} was reconstructed from certified replay artifacts and immutable governance references.`,
  };
  return Object.freeze({ ...source, hash: hashValue("governance-replay-artifact", source) });
}

function timeline(state: GovernanceReplayViewerState): readonly GovernanceReplayTimelineEvent[] {
  return freezeArray(STAGES.map((stage, index) => {
    const eventState = state === "REPRODUCED" ? "REPRODUCED" : index < 7 ? "REPRODUCED" : state;
    const source = {
      event_id: `GRVE-7K2-${String(index + 1).padStart(2, "0")}`,
      stage,
      timestamp: `2026-06-27T15:${String(30 + index).padStart(2, "0")}:00.000Z`,
      state: eventState as GovernanceReplayViewerState,
      checkpoint_ref: `checkpoint:7k2:${stage.toLowerCase()}`,
      duration_ms: 45 + index * 7,
      explanation: `${stage.replace(/_/g, " ").toLowerCase()} rendered from certified replay state.`,
    };
    return Object.freeze({ ...source, event_hash: hashValue("governance-replay-timeline-event", source) });
  }));
}

function mismatch(state: GovernanceReplayViewerState): GovernanceReplayComparison["mismatches"] {
  if (state === "REPRODUCED") return freezeArray([]);
  const severity: GovernanceReplayMismatchSeverity = state === "INVALID" ? "CRITICAL" : state === "MISMATCH" ? "HIGH" : "MEDIUM";
  return freezeArray([Object.freeze({
    mismatch_id: `mismatch:7k2:${state.toLowerCase()}`,
    severity,
    category: state === "INCOMPLETE" ? "EVIDENCE" as const : state === "INVALID" ? "INTEGRITY" as const : "HASH" as const,
    summary: state === "INCOMPLETE" ? "Replay cannot finish because a certified dependency is missing." : state === "INVALID" ? "Replay cannot be trusted due to integrity verification failure." : "Replay completed but reconstructed hash differs from original.",
    investigation_refs: freezeArray(["investigation:7k2:replay", "truth-ledger:7j5:certification"]),
  })]);
}

function comparison(state: GovernanceReplayViewerState, replayHash: string, reconstructionHash: string): GovernanceReplayComparison {
  const mismatches = mismatch(state);
  const source = {
    comparison_id: `GRC-7K2-${hashValue("governance-replay-comparison-id", { state, replayHash }).slice(0, 10).toUpperCase()}`,
    exact_match: state === "REPRODUCED",
    original_hash: replayHash,
    replay_hash: state === "MISMATCH" ? `${reconstructionHash}:mismatch` : reconstructionHash,
    mismatches,
  };
  return Object.freeze({ ...source, comparison_hash: hashValue("governance-replay-comparison", source) });
}

function verification(state: GovernanceReplayViewerState, certification: ReturnType<typeof runGovernanceQueryCertification>): GovernanceReplayVerification {
  const source = {
    verification_state: state,
    reconstruction_complete: state === "REPRODUCED" || state === "MISMATCH",
    replay_confidence: state === "REPRODUCED" ? 0.97 : state === "MISMATCH" ? 0.68 : state === "INCOMPLETE" ? 0.44 : 0.12,
    determinism_validated: state !== "INVALID",
    integrity_validated: state === "REPRODUCED" || state === "INCOMPLETE",
    certification_outcome: certification.status,
    validation_rules: freezeArray(["same inputs produce same replay hash", "timeline ordering is stable", "evidence lineage is visible", "integrity chain is verified", "certification outcome is preserved"]),
  };
  return Object.freeze({ ...source, verification_hash: hashValue("governance-replay-verification", source) });
}

export function buildGovernanceReplayViewerView(input: GovernanceReplayViewerInput = {}): GovernanceReplayViewerView {
  const state = input.state ?? "REPRODUCED";
  const certification = runGovernanceQueryCertification();
  const tenant_id = input.tenant_id ?? "tenant_alpha";
  const mission_id = input.mission_id ?? "mission_governance_001";
  const operator_id = input.operator_id ?? "operator_console";
  const replay_id = input.replay_id ?? certification.historical_response?.replay_validation?.replay_id ?? "replay:governance:7k2";
  const inputs = freezeArray([
    artifact("INPUT", "Replay query parameters", "VISIBLE", "query"),
    artifact("INPUT", "Mission governance context", "VISIBLE", "mission"),
    artifact("INPUT", "Certified query contract", "VERIFIED", "contract"),
  ]);
  const outputs = freezeArray([artifact("OUTPUT", "Reconstructed governance output", state === "REPRODUCED" ? "VERIFIED" : "MISMATCH", "output")]);
  const evidence = freezeArray([artifact("EVIDENCE", "Replay evidence chain", state === "INCOMPLETE" ? "MISSING" : "VERIFIED", "evidence")]);
  const policies = freezeArray([artifact("POLICY", "Historical tenant isolation policy", "RECONSTRUCTED", "policy")]);
  const risks = freezeArray([artifact("RISK", "Governance replay risk", state === "INVALID" ? "INVALID" : "RECONSTRUCTED", "risk")]);
  const compliance = freezeArray([artifact("COMPLIANCE", "Constitutional compliance replay", "VERIFIED", "compliance")]);
  const recommendations = freezeArray([artifact("RECOMMENDATION", "Replayed governance recommendation", "RECONSTRUCTED", "recommendation")]);
  const escalations = freezeArray([artifact("ESCALATION", "Replay escalation routing", state === "REPRODUCED" ? "VERIFIED" : "MISMATCH", "escalation")]);
  const replay_hash = certification.search_response?.replay_support.reconstruction_hash ?? hashValue("governance-replay-fallback", replay_id);
  const reconstruction_hash = certification.historical_response?.reconstruction_hash ?? hashValue("governance-replay-reconstruction", replay_id);
  const hashes = Object.freeze({
    replay_hash,
    reconstruction_hash,
    evidence_hash: hashValue("governance-replay-evidence", evidence.map((item) => item.hash)),
    policy_hash: hashValue("governance-replay-policy", policies.map((item) => item.hash)),
    integrity_chain_hash: hashValue("governance-replay-integrity-chain", { replay_hash, reconstruction_hash }),
    hash_comparison: state === "REPRODUCED" ? "MATCH" as const : "MISMATCH" as const,
  });
  const verificationResult = verification(state, certification);
  const comparisonResult = comparison(state, replay_hash, reconstruction_hash);
  const source = {
    viewer_id: `GRV-7K2-${hashValue("governance-replay-viewer-id", { tenant_id, mission_id, replay_id, state }).slice(0, 10).toUpperCase()}`,
    schema_version: SCHEMA_VERSION,
    tenant_id,
    mission_id,
    operator_id,
    replay_id,
    replay_state: state,
    replay_version: "governance-replay-view/v7K.2" as const,
    replay_timestamp: NOW,
    read_only: true as const,
    advisory_only: true as const,
    replay_execution_allowed: false as const,
    mutation_allowed: false as const,
    tenant_isolated: true,
    authorization_enforced: true,
    inputs,
    outputs,
    evidence,
    policies,
    risks,
    compliance,
    recommendations,
    escalations,
    timeline: timeline(state),
    hashes,
    verification: verificationResult,
    comparison: comparisonResult,
  };
  return Object.freeze({ ...source, viewer_hash: hashValue("governance-replay-viewer", source) });
}

export function buildGovernanceReplayViewerObservabilitySurface(input: GovernanceReplayViewerInput = {}): GovernanceReplayViewerObservabilitySurface {
  const view = buildGovernanceReplayViewerView(input);
  return Object.freeze({
    viewer_id: view.viewer_id,
    replay_id: view.replay_id,
    replay_state: view.replay_state,
    timeline_events: view.timeline.length,
    mismatch_count: view.comparison.mismatches.length,
    read_only: true,
    viewer_hash: view.viewer_hash,
  });
}

export function assertGovernanceReplayViewerActionBlocked(action: GovernanceReplayViewerAction): never {
  throw new Error(`Governance Replay Viewer is read-only; ${action} is not permitted.`);
}

export function getGovernanceReplayViewerContract() {
  const view = buildGovernanceReplayViewerView();
  return Object.freeze({
    doctrine: Object.freeze({
      principles: freezeArray(["read-only", "advisory-only", "deterministic", "replay-consistent", "explainable", "immutable", "audit-ready", "tenant-isolated", "integrity-verified", "constitution-protected"]),
      schema_version: SCHEMA_VERSION,
      stages: STAGES,
      states: freezeArray(["REPRODUCED", "MISMATCH", "INVALID", "INCOMPLETE"] as const),
      prohibited_actions: freezeArray(["EXECUTE_REPLAY", "MODIFY_REPLAY", "MODIFY_EVIDENCE", "ALTER_HISTORY", "OVERRIDE_GOVERNANCE"] as const),
    }),
    view,
    observability: buildGovernanceReplayViewerObservabilitySurface(),
  });
}
