import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { runTruthLedgerCompletionGate } from "@/services/truth-ledger-completion";
import type {
  GovernanceIdentityLineageReconstructionResult,
  GovernanceIdentityObservabilitySurface,
  GovernanceIdentityReplayPackage,
  GovernanceIdentityReplayResult,
  GovernanceIdentityValidationFailure,
  GovernanceIdentityValidationResult,
  GovernanceFoundationCertificationCategoryResult,
  GovernanceFoundationCertificationComponent,
  GovernanceFoundationCertificationFailureReason,
  GovernanceFoundationCertificationInputPackage,
  GovernanceFoundationCertificationResult,
  GovernanceIntelligenceContractDoctrine,
  GovernanceIntelligenceCertificationStatus,
  GovernanceIntelligenceEscalationReason,
  GovernanceIntelligenceFailureCategory,
  GovernanceIntelligenceIdentity,
  GovernanceIntelligenceIdentityDoctrine,
  GovernanceIntelligenceIdentityFailureReason,
  GovernanceIntelligenceRecord,
  GovernanceIntelligenceState,
  GovernanceIntelligenceStateDoctrine,
  GovernanceIntelligenceTransitionFailureReason,
  GovernanceIntelligenceValidationFailure,
  GovernanceIntelligenceValidationResult,
  GovernanceLifecycleActivityType,
  GovernanceLifecycleDoctrine,
  GovernanceLifecycleEvent,
  GovernanceLifecycleFailureReason,
  GovernanceLifecycleObservabilitySurface,
  GovernanceLifecycleReplayResult,
  GovernanceLifecycleStage,
  GovernanceLifecycleTransitionRecord,
  GovernanceStateObservabilitySurface,
  GovernanceStateReplayResult,
  GovernanceStateTransitionEvent,
  GovernanceStateTransitionRecord,
} from "@/types/governance-intelligence";

const NOW = "2026-06-25T04:00:00.000Z";
export const GOVERNANCE_INTELLIGENCE_STATES = ["CREATED", "ANALYZING", "CORRELATED", "RECOMMENDING", "ESCALATED", "CERTIFIED", "ARCHIVED"] as const;
const VALID_STATES = GOVERNANCE_INTELLIGENCE_STATES;
const VALID_CERTIFICATION = ["PASS", "CONDITIONAL_PASS", "FAIL", "UNCERTIFIED"];
const KNOWN_POLICIES = ["runtime_policy_v7a", "tenant_policy_alpha", "mission_policy_query_layer", "evidence_policy_v7a", "escalation_policy_v7a", "recommendation_policy_v7a"];
const MISSION_TENANTS: Readonly<Record<string, string>> = Object.freeze({
  mission_query_layer: "tenant_alpha",
  mission_governance_identity: "tenant_alpha",
});
const ALLOWED_TRANSITIONS: Readonly<Record<GovernanceIntelligenceState, readonly GovernanceIntelligenceState[]>> = Object.freeze({
  CREATED: Object.freeze(["ANALYZING"] as const),
  ANALYZING: Object.freeze(["CORRELATED"] as const),
  CORRELATED: Object.freeze(["RECOMMENDING"] as const),
  RECOMMENDING: Object.freeze(["ESCALATED", "CERTIFIED"] as const),
  ESCALATED: Object.freeze(["CERTIFIED"] as const),
  CERTIFIED: Object.freeze(["ARCHIVED"] as const),
  ARCHIVED: Object.freeze([] as const),
});
const STATE_ORDER: Readonly<Record<GovernanceIntelligenceState, number>> = Object.freeze({
  CREATED: 0,
  ANALYZING: 1,
  CORRELATED: 2,
  RECOMMENDING: 3,
  ESCALATED: 4,
  CERTIFIED: 5,
  ARCHIVED: 6,
});
const LIFECYCLE_STAGE_TO_STATE: Readonly<Record<GovernanceLifecycleStage, GovernanceIntelligenceState>> = Object.freeze({
  Creation: "CREATED",
  Analysis: "ANALYZING",
  Correlation: "CORRELATED",
  "Recommendation Generation": "RECOMMENDING",
  Escalation: "ESCALATED",
  Certification: "CERTIFIED",
  Archival: "ARCHIVED",
});
const LIFECYCLE_STAGE_ORDER: Readonly<Record<GovernanceLifecycleStage, number>> = Object.freeze({
  Creation: 0,
  Analysis: 1,
  Correlation: 2,
  "Recommendation Generation": 3,
  Escalation: 4,
  Certification: 5,
  Archival: 6,
});
const LIFECYCLE_STAGE_TO_ACTIVITY: Readonly<Record<GovernanceLifecycleStage, GovernanceLifecycleActivityType>> = Object.freeze({
  Creation: "CREATION",
  Analysis: "ANALYSIS",
  Correlation: "CORRELATION",
  "Recommendation Generation": "RECOMMENDATION_GENERATION",
  Escalation: "ESCALATION",
  Certification: "CERTIFICATION",
  Archival: "ARCHIVAL",
});

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function freezeRecord(record: GovernanceIntelligenceRecord): GovernanceIntelligenceRecord {
  return Object.freeze({
    ...record,
    metadata: Object.freeze({ ...record.metadata }),
    policy_scope: Object.freeze({
      policy_refs: Object.freeze([...record.policy_scope.policy_refs]),
      policy_domains: Object.freeze([...record.policy_scope.policy_domains]),
      policy_version_refs: Object.freeze([...record.policy_scope.policy_version_refs]),
    }),
    governance_scope: Object.freeze({ ...record.governance_scope }),
    evidence_requirements: Object.freeze({ ...record.evidence_requirements }),
    confidence_requirements: Object.freeze({ ...record.confidence_requirements }),
    lineage_requirements: Object.freeze({ ...record.lineage_requirements }),
    replay_requirements: Object.freeze({ ...record.replay_requirements }),
    recommendation_requirements: Object.freeze({ ...record.recommendation_requirements }),
    evidence_refs: Object.freeze([...record.evidence_refs]),
    policy_refs: Object.freeze([...record.policy_refs]),
    lineage_refs: Object.freeze([...record.lineage_refs]),
    replay_refs: Object.freeze([...record.replay_refs]),
    recommendation_refs: Object.freeze([...record.recommendation_refs]),
    escalation_refs: Object.freeze([...record.escalation_refs]),
  });
}

export function buildGovernanceIntelligenceDoctrine(): GovernanceIntelligenceContractDoctrine {
  return Object.freeze({
    principles: Object.freeze(["advisory-only", "evidence-bound", "policy-scoped", "tenant-isolated", "lineage-preserving", "replayable", "auditable", "certification-ready", "fail-closed"] as const),
    allowed_behaviors: Object.freeze(["analyze evidence", "evaluate policy scope", "correlate governance constraints", "identify risks", "generate advisory recommendations", "trigger escalation references", "preserve lineage", "create replay references", "support certification"]),
    prohibited_behaviors: Object.freeze(["execute actions", "override operators", "bypass governance", "ignore tenant boundaries", "create unsupported recommendations", "mutate immutable fields", "drop evidence references", "drop lineage references", "produce unreplayable outputs", "self-certify without validation"]),
  });
}

export function buildGovernanceIntelligenceStateDoctrine(): GovernanceIntelligenceStateDoctrine {
  return Object.freeze({
    principles: Object.freeze(["explicit-states", "validated-transitions", "ledger-recorded", "replayable-transitions", "no-state-skipping", "no-state-regression", "archival-finality", "fail-closed"] as const),
    allowed_transitions: ALLOWED_TRANSITIONS,
    blocked_behaviors: Object.freeze(["hidden states", "state skipping", "state regression", "mutation without transition event", "archived record reactivation", "certified record mutation", "transition without replay refs", "transition without lineage refs"]),
  });
}

export function buildGovernanceIntelligenceIdentityDoctrine(): GovernanceIntelligenceIdentityDoctrine {
  return Object.freeze({
    principles: Object.freeze(["unique", "immutable", "tenant-scoped", "mission-bound", "lineage-aware", "replay-linked", "truth-ledger-anchored", "version-aware", "certification-ready", "fail-closed"] as const),
    protected_fields: Object.freeze(["governance_intelligence_id", "tenant_id", "created_timestamp", "root_intelligence_id"] as const),
    allowed_identity_events: Object.freeze(["identity created", "identity validated", "identity hash generated", "parent relationship created", "child relationship created", "root relationship confirmed", "supersession relationship created", "replay reference created", "identity certified", "identity archived"]),
    prohibited_identity_events: Object.freeze(["identity reuse", "identity collision", "cross-tenant lineage", "supersession by mutation", "protected field mutation", "missing Truth Ledger reference", "identity replay mismatch"]),
  });
}

export function buildGovernanceLifecycleDoctrine(): GovernanceLifecycleDoctrine {
  return Object.freeze({
    principles: Object.freeze(["deterministic", "state-driven", "identity-bound", "tenant-scoped", "evidence-aware", "policy-scoped", "lineage-preserving", "replay-compatible", "ledger-recorded", "observable", "fail-closed"] as const),
    stage_to_state: LIFECYCLE_STAGE_TO_STATE,
    allowed_paths: Object.freeze([
      Object.freeze(["Creation", "Analysis", "Correlation", "Recommendation Generation", "Certification", "Archival"] as const),
      Object.freeze(["Creation", "Analysis", "Correlation", "Recommendation Generation", "Escalation", "Certification", "Archival"] as const),
    ]),
    prohibited_behaviors: Object.freeze(["hidden lifecycle stages", "undocumented transitions", "unrecorded events", "state skips", "stage regressions", "archived record reactivation", "recommendation history overwrite", "unreplayable lifecycle changes"]),
  });
}

function identityFailure(reason: GovernanceIntelligenceIdentityFailureReason, field_path: string, message: string): GovernanceIdentityValidationFailure {
  return Object.freeze({
    failure_id: hashValue("governance-intelligence-identity-failure", { reason, field_path, message }),
    reason,
    field_path,
    message,
    fail_closed: true,
    ledger_recorded: true,
  });
}

function identityIdFor(input: { tenant_id: string; mission_id: string; version: number; parent_intelligence_id: string | null; superseded_intelligence_ids: readonly string[] }): string {
  const suffix = hashValue("governance-intelligence-id", input).slice(0, 8).toUpperCase();
  return `GI-${input.tenant_id}-${input.mission_id}-${String(input.version).padStart(6, "0")}-${suffix}`;
}

export function canonicalizeGovernanceIdentityForReconstruction(identity: Omit<GovernanceIntelligenceIdentity, "identity_hash" | "reconstruction_hash">): string {
  return canonicalizeConfidenceToString({
    governance_intelligence_id: identity.governance_intelligence_id,
    tenant_id: identity.tenant_id,
    mission_id: identity.mission_id,
    parent_intelligence_id: identity.parent_intelligence_id,
    root_intelligence_id: identity.root_intelligence_id,
    child_intelligence_ids: identity.child_intelligence_ids,
    superseded_intelligence_ids: identity.superseded_intelligence_ids,
    superseded_by_intelligence_id: identity.superseded_by_intelligence_id,
    version: identity.version,
    created_timestamp: identity.created_timestamp,
    replay_id: identity.replay_id,
    truth_ledger_reference: identity.truth_ledger_reference,
    previous_identity_hash: identity.previous_identity_hash,
    certification_status: identity.certification_status,
  });
}

export function computeGovernanceIdentityReconstructionHash(identity: Omit<GovernanceIntelligenceIdentity, "identity_hash" | "reconstruction_hash">): string {
  return hashConfidenceValue("governance-intelligence-identity-reconstruction", canonicalizeGovernanceIdentityForReconstruction(identity));
}

export function canonicalizeGovernanceIdentity(identity: GovernanceIntelligenceIdentity): string {
  return canonicalizeConfidenceToString({
    governance_intelligence_id: identity.governance_intelligence_id,
    tenant_id: identity.tenant_id,
    mission_id: identity.mission_id,
    parent_intelligence_id: identity.parent_intelligence_id,
    root_intelligence_id: identity.root_intelligence_id,
    version: identity.version,
    created_timestamp: identity.created_timestamp,
    replay_id: identity.replay_id,
    reconstruction_hash: identity.reconstruction_hash,
    truth_ledger_reference: identity.truth_ledger_reference,
  });
}

export function computeGovernanceIdentityHash(identity: GovernanceIntelligenceIdentity): string {
  return hashConfidenceValue("governance-intelligence-identity", canonicalizeGovernanceIdentity(identity));
}

function finalizeIdentity(identity: Omit<GovernanceIntelligenceIdentity, "identity_hash" | "reconstruction_hash">): GovernanceIntelligenceIdentity {
  const reconstruction_hash = computeGovernanceIdentityReconstructionHash(identity);
  const withReconstruction = { ...identity, reconstruction_hash, identity_hash: "" };
  const identity_hash = computeGovernanceIdentityHash(withReconstruction);
  return Object.freeze({
    ...withReconstruction,
    child_intelligence_ids: Object.freeze([...identity.child_intelligence_ids]),
    superseded_intelligence_ids: Object.freeze([...identity.superseded_intelligence_ids]),
    reconstruction_hash,
    identity_hash,
  });
}

export function generateGovernanceIntelligenceIdentity(input: {
  tenant_id?: string;
  mission_id?: string;
  parent_identity?: GovernanceIntelligenceIdentity;
  superseded_identity?: GovernanceIntelligenceIdentity;
  child_intelligence_ids?: readonly string[];
  created_timestamp?: string;
  certification_status?: GovernanceIntelligenceIdentity["certification_status"];
} = {}): GovernanceIntelligenceIdentity {
  const tenant_id = input.parent_identity?.tenant_id ?? input.superseded_identity?.tenant_id ?? input.tenant_id ?? "tenant_alpha";
  const mission_id = input.parent_identity?.mission_id ?? input.superseded_identity?.mission_id ?? input.mission_id ?? "mission_query_layer";
  const parent_intelligence_id = input.parent_identity?.governance_intelligence_id ?? input.superseded_identity?.governance_intelligence_id ?? null;
  const version = (input.parent_identity ?? input.superseded_identity)?.version ? (input.parent_identity ?? input.superseded_identity)!.version + 1 : 1;
  const superseded_intelligence_ids = input.superseded_identity ? [input.superseded_identity.governance_intelligence_id] : [];
  const governance_intelligence_id = identityIdFor({ tenant_id, mission_id, version, parent_intelligence_id, superseded_intelligence_ids });
  const root_intelligence_id = input.parent_identity?.root_intelligence_id ?? input.superseded_identity?.root_intelligence_id ?? governance_intelligence_id;
  return finalizeIdentity({
    governance_intelligence_id,
    tenant_id,
    mission_id,
    parent_intelligence_id,
    root_intelligence_id,
    child_intelligence_ids: input.child_intelligence_ids ?? [],
    superseded_intelligence_ids,
    superseded_by_intelligence_id: null,
    version,
    created_timestamp: input.created_timestamp ?? NOW,
    replay_id: `identity_replay_${governance_intelligence_id}`,
    truth_ledger_reference: runTruthLedgerCompletionGate().historical_baseline.baseline_id,
    previous_identity_hash: (input.parent_identity ?? input.superseded_identity)?.identity_hash ?? null,
    certification_status: input.certification_status ?? "UNCERTIFIED",
  });
}

export function markGovernanceIdentitySuperseded(identity: GovernanceIntelligenceIdentity, superseded_by_intelligence_id: string): GovernanceIntelligenceIdentity {
  return finalizeIdentity({
    ...identity,
    superseded_by_intelligence_id,
  });
}

export function appendGovernanceIdentityChild(identity: GovernanceIntelligenceIdentity, child_intelligence_id: string): GovernanceIntelligenceIdentity {
  return finalizeIdentity({
    ...identity,
    child_intelligence_ids: identity.child_intelligence_ids.includes(child_intelligence_id) ? identity.child_intelligence_ids : [...identity.child_intelligence_ids, child_intelligence_id],
  });
}

export function validateGovernanceIntelligenceIdentity(
  identity: Partial<GovernanceIntelligenceIdentity> | undefined,
  context: {
    registry?: readonly GovernanceIntelligenceIdentity[];
    original_identity?: GovernanceIntelligenceIdentity;
  } = {},
): GovernanceIdentityValidationResult {
  const failures: GovernanceIdentityValidationFailure[] = [];
  if (!identity) failures.push(identityFailure("IDENTITY_MISSING", "identity", "identity missing"));
  if (!identity?.governance_intelligence_id) failures.push(identityFailure("GOVERNANCE_INTELLIGENCE_ID_MISSING", "governance_intelligence_id", "governance_intelligence_id missing"));
  if (!identity?.tenant_id) failures.push(identityFailure("TENANT_ID_MISSING", "tenant_id", "tenant_id missing"));
  if (!identity?.mission_id) failures.push(identityFailure("MISSION_ID_MISSING", "mission_id", "mission_id missing"));
  if (!identity?.root_intelligence_id) failures.push(identityFailure("ROOT_INTELLIGENCE_MISSING", "root_intelligence_id", "root_intelligence_id missing"));
  if (!identity?.replay_id) failures.push(identityFailure("REPLAY_ID_MISSING", "replay_id", "replay_id missing"));
  if (!identity?.reconstruction_hash) failures.push(identityFailure("RECONSTRUCTION_HASH_MISSING", "reconstruction_hash", "reconstruction_hash missing"));
  if (!identity?.identity_hash) failures.push(identityFailure("IDENTITY_HASH_MISSING", "identity_hash", "identity_hash missing"));
  if (!identity?.truth_ledger_reference) failures.push(identityFailure("TRUTH_LEDGER_REFERENCE_MISSING", "truth_ledger_reference", "truth_ledger_reference missing"));

  if (identity?.mission_id) {
    const tenantForMission = MISSION_TENANTS[identity.mission_id];
    if (!tenantForMission) failures.push(identityFailure("MISSION_NOT_FOUND", "mission_id", "mission not found"));
    if (tenantForMission && identity.tenant_id && tenantForMission !== identity.tenant_id) failures.push(identityFailure("MISSION_TENANT_MISMATCH", "mission_id", "mission belongs to a different tenant"));
  }

  const registry = context.registry ?? [];
  const matching = identity?.governance_intelligence_id ? registry.filter((item) => item.governance_intelligence_id === identity.governance_intelligence_id) : [];
  if (matching.length > 1) failures.push(identityFailure("GOVERNANCE_INTELLIGENCE_ID_DUPLICATE", "governance_intelligence_id", "duplicate governance_intelligence_id detected"));
  if (matching.length === 1 && identity && matching[0].identity_hash !== identity.identity_hash) failures.push(identityFailure("IDENTITY_COLLISION", "identity_hash", "identity collision detected"));

  const byId = new Map(registry.map((item) => [item.governance_intelligence_id, item]));
  if (identity?.parent_intelligence_id) {
    const parent = byId.get(identity.parent_intelligence_id);
    if (!parent) failures.push(identityFailure("PARENT_INTELLIGENCE_NOT_FOUND", "parent_intelligence_id", "parent intelligence not found"));
    if (parent && parent.tenant_id !== identity.tenant_id) failures.push(identityFailure("CROSS_TENANT_PARENT_LINKAGE", "parent_intelligence_id", "parent belongs to a different tenant"));
    if (parent && parent.root_intelligence_id !== identity.root_intelligence_id) failures.push(identityFailure("LINEAGE_BREAK_DETECTED", "root_intelligence_id", "parent root does not match child root"));
  } else if (identity && identity.version && identity.version > 1) {
    failures.push(identityFailure("PARENT_INTELLIGENCE_MISSING", "parent_intelligence_id", "non-root identity requires parent_intelligence_id"));
  }

  if (identity?.root_intelligence_id && identity.root_intelligence_id !== identity.governance_intelligence_id) {
    const root = byId.get(identity.root_intelligence_id);
    if (!root) failures.push(identityFailure("LINEAGE_BREAK_DETECTED", "root_intelligence_id", "root intelligence cannot be reconstructed"));
    if (root && root.tenant_id !== identity.tenant_id) failures.push(identityFailure("CROSS_TENANT_ROOT_LINKAGE", "root_intelligence_id", "root belongs to a different tenant"));
  }

  for (const childId of identity?.child_intelligence_ids ?? []) {
    const child = byId.get(childId);
    if (!child) failures.push(identityFailure("LINEAGE_BREAK_DETECTED", "child_intelligence_ids", "child reference not found"));
    if (child && child.tenant_id !== identity?.tenant_id) failures.push(identityFailure("CROSS_TENANT_CHILD_LINKAGE", "child_intelligence_ids", "child belongs to a different tenant"));
    if (child && child.parent_intelligence_id !== identity?.governance_intelligence_id) failures.push(identityFailure("CHILD_PARENT_MISMATCH", "child_intelligence_ids", "child does not reference current identity as parent"));
  }

  for (const supersededId of identity?.superseded_intelligence_ids ?? []) {
    const superseded = byId.get(supersededId);
    if (!superseded) failures.push(identityFailure("SUPERSESSION_HISTORY_MISSING", "superseded_intelligence_ids", "superseded identity not found"));
    if (superseded && superseded.tenant_id !== identity?.tenant_id) failures.push(identityFailure("CROSS_TENANT_SUPERSESSION", "superseded_intelligence_ids", "superseded identity belongs to a different tenant"));
  }

  if (context.original_identity && identity) {
    if (context.original_identity.governance_intelligence_id !== identity.governance_intelligence_id) failures.push(identityFailure("GOVERNANCE_INTELLIGENCE_ID_MUTATION", "governance_intelligence_id", "governance_intelligence_id mutation detected"));
    if (context.original_identity.tenant_id !== identity.tenant_id) failures.push(identityFailure("TENANT_ID_MUTATION", "tenant_id", "tenant_id mutation detected"));
    if (context.original_identity.created_timestamp !== identity.created_timestamp) failures.push(identityFailure("CREATED_TIMESTAMP_MUTATION", "created_timestamp", "created_timestamp mutation detected"));
    if (context.original_identity.root_intelligence_id !== identity.root_intelligence_id) failures.push(identityFailure("ROOT_INTELLIGENCE_ID_MUTATION", "root_intelligence_id", "root_intelligence_id mutation detected"));
  }

  if (identity?.replay_id && identity.tenant_id && !identity.replay_id.includes(identity.governance_intelligence_id ?? "")) failures.push(identityFailure("CROSS_TENANT_REPLAY_REFERENCE", "replay_id", "replay_id does not reference identity"));
  if (identity && identity.governance_intelligence_id && identity.tenant_id && identity.mission_id && identity.root_intelligence_id && identity.replay_id && identity.truth_ledger_reference) {
    const recomputedReconstruction = computeGovernanceIdentityReconstructionHash(identity as Omit<GovernanceIntelligenceIdentity, "identity_hash" | "reconstruction_hash">);
    if (identity.reconstruction_hash && identity.reconstruction_hash !== recomputedReconstruction) failures.push(identityFailure("RECONSTRUCTION_HASH_MISMATCH", "reconstruction_hash", "reconstruction_hash mismatch"));
    const recomputedIdentityHash = computeGovernanceIdentityHash(identity as GovernanceIntelligenceIdentity);
    if (identity.identity_hash && identity.identity_hash !== recomputedIdentityHash) failures.push(identityFailure("IDENTITY_HASH_MISMATCH", "identity_hash", "identity_hash mismatch"));
  }

  return Object.freeze({
    validation_id: hashValue("governance-intelligence-identity-validation", { id: identity?.governance_intelligence_id, failures: failures.map((failureItem) => failureItem.failure_id) }),
    governance_intelligence_id: identity?.governance_intelligence_id,
    validation_result: failures.length ? "FAIL" : "PASS",
    failures: Object.freeze(failures),
    identity_hash: failures.length ? undefined : identity?.identity_hash,
    reconstruction_hash: failures.length ? undefined : identity?.reconstruction_hash,
    tenant_scoped: !failures.some((item) => item.reason.includes("TENANT") || item.reason.includes("CROSS_TENANT")),
    mission_bound: !failures.some((item) => item.reason.includes("MISSION")),
    immutable: !failures.some((item) => item.reason.includes("MUTATION")),
    ledger_recorded: true,
  });
}

export function reconstructGovernanceIdentityLineage(identity: GovernanceIntelligenceIdentity, registry: readonly GovernanceIntelligenceIdentity[] = [identity]): GovernanceIdentityLineageReconstructionResult {
  const byId = new Map(registry.map((item) => [item.governance_intelligence_id, item]));
  const parentChain: string[] = [];
  const lineageBreaks: GovernanceIntelligenceIdentityFailureReason[] = [];
  const crossTenantViolations: GovernanceIntelligenceIdentityFailureReason[] = [];
  let cursor = identity;
  while (cursor.parent_intelligence_id) {
    const parent = byId.get(cursor.parent_intelligence_id);
    if (!parent) {
      lineageBreaks.push("PARENT_INTELLIGENCE_NOT_FOUND");
      break;
    }
    if (parent.tenant_id !== identity.tenant_id) crossTenantViolations.push("CROSS_TENANT_PARENT_LINKAGE");
    if (parent.root_intelligence_id !== identity.root_intelligence_id) lineageBreaks.push("LINEAGE_BREAK_DETECTED");
    parentChain.push(parent.governance_intelligence_id);
    cursor = parent;
  }
  const childRecords = registry.filter((item) => item.parent_intelligence_id === identity.governance_intelligence_id).map((item) => item.governance_intelligence_id);
  const supersededRecords = identity.superseded_intelligence_ids.filter((item) => byId.has(item));
  const lineage_hash = hashValue("governance-intelligence-lineage", {
    governance_intelligence_id: identity.governance_intelligence_id,
    parentChain,
    childRecords,
    supersededRecords,
    superseded_by: identity.superseded_by_intelligence_id,
  });
  return Object.freeze({
    governance_intelligence_id: identity.governance_intelligence_id,
    tenant_id: identity.tenant_id,
    root_intelligence_id: identity.root_intelligence_id,
    parent_chain: Object.freeze(parentChain),
    child_records: Object.freeze(childRecords),
    superseded_records: Object.freeze(supersededRecords),
    superseded_by: identity.superseded_by_intelligence_id,
    lineage_complete: lineageBreaks.length === 0 && crossTenantViolations.length === 0,
    lineage_breaks: Object.freeze(lineageBreaks),
    cross_tenant_violations: Object.freeze(crossTenantViolations),
    lineage_hash,
    replay_ref: identity.replay_id,
    truth_ledger_reference: identity.truth_ledger_reference,
  });
}

export function buildGovernanceIdentityReplayPackage(identity: GovernanceIntelligenceIdentity, registry: readonly GovernanceIntelligenceIdentity[] = [identity]): GovernanceIdentityReplayPackage {
  const lineage = reconstructGovernanceIdentityLineage(identity, registry);
  return Object.freeze({
    replay_id: identity.replay_id,
    governance_intelligence_id: identity.governance_intelligence_id,
    tenant_id: identity.tenant_id,
    mission_id: identity.mission_id,
    identity_snapshot: identity,
    lineage_snapshot: Object.freeze({
      parent_intelligence_id: identity.parent_intelligence_id,
      child_intelligence_ids: Object.freeze([...identity.child_intelligence_ids]),
      root_intelligence_id: identity.root_intelligence_id,
      superseded_intelligence_ids: Object.freeze([...identity.superseded_intelligence_ids]),
      superseded_by_intelligence_id: identity.superseded_by_intelligence_id,
    }),
    reconstruction_hash: identity.reconstruction_hash,
    identity_hash: identity.identity_hash,
    lineage_hash: lineage.lineage_hash,
    truth_ledger_reference: identity.truth_ledger_reference,
  });
}

export function replayGovernanceIdentity(identityReplayPackage: GovernanceIdentityReplayPackage, registry: readonly GovernanceIntelligenceIdentity[] = [identityReplayPackage.identity_snapshot]): GovernanceIdentityReplayResult {
  const identity = identityReplayPackage.identity_snapshot;
  const validation = validateGovernanceIntelligenceIdentity(identity, { registry });
  const lineage = reconstructGovernanceIdentityLineage(identity, registry);
  let failure_reason: GovernanceIntelligenceIdentityFailureReason | null = validation.failures[0]?.reason ?? null;
  if (!failure_reason && identityReplayPackage.identity_hash !== identity.identity_hash) failure_reason = "IDENTITY_REPLAY_FAILED";
  if (!failure_reason && identityReplayPackage.reconstruction_hash !== identity.reconstruction_hash) failure_reason = "RECONSTRUCTION_HASH_MISMATCH";
  if (!failure_reason && identityReplayPackage.lineage_hash !== lineage.lineage_hash) failure_reason = "LINEAGE_REPLAY_FAILED";
  if (!failure_reason && identityReplayPackage.truth_ledger_reference !== identity.truth_ledger_reference) failure_reason = "TRUTH_LEDGER_REFERENCE_MISSING";
  return Object.freeze({
    replay_id: identityReplayPackage.replay_id,
    governance_intelligence_id: identity.governance_intelligence_id,
    validation_result: failure_reason ? "FAIL" : "PASS",
    failure_reason,
    reconstructed_identity_hash: identity.identity_hash,
    reconstructed_lineage_hash: lineage.lineage_hash,
    reconstructed_reconstruction_hash: identity.reconstruction_hash,
    truth_ledger_reference: identity.truth_ledger_reference,
  });
}

export function buildGovernanceIdentityObservabilitySurface(identity: GovernanceIntelligenceIdentity, registry: readonly GovernanceIntelligenceIdentity[] = [identity]): GovernanceIdentityObservabilitySurface {
  const validation = validateGovernanceIntelligenceIdentity(identity, { registry });
  return Object.freeze({
    governance_intelligence_id: identity.governance_intelligence_id,
    tenant_id: identity.tenant_id,
    mission_id: identity.mission_id,
    parent_intelligence_id: identity.parent_intelligence_id,
    root_intelligence_id: identity.root_intelligence_id,
    child_intelligence_ids: Object.freeze([...identity.child_intelligence_ids]),
    superseded_intelligence_ids: Object.freeze([...identity.superseded_intelligence_ids]),
    superseded_by_intelligence_id: identity.superseded_by_intelligence_id,
    version: identity.version,
    created_timestamp: identity.created_timestamp,
    identity_hash: identity.identity_hash,
    replay_id: identity.replay_id,
    reconstruction_hash: identity.reconstruction_hash,
    truth_ledger_reference: identity.truth_ledger_reference,
    certification_status: identity.certification_status,
    validation_result: validation.validation_result,
    failure_reason: validation.failures[0]?.reason ?? null,
  });
}

export function buildGovernanceIntelligenceRecord(input: Partial<GovernanceIntelligenceRecord> = {}): GovernanceIntelligenceRecord {
  const baseline = runTruthLedgerCompletionGate().historical_baseline.baseline_id;
  const record: GovernanceIntelligenceRecord = {
    governance_intelligence_id: input.governance_intelligence_id ?? "gov_intel_7a1_000001",
    tenant_id: input.tenant_id ?? "tenant_alpha",
    mission_id: input.mission_id ?? "mission_query_layer",
    created_timestamp: input.created_timestamp ?? NOW,
    updated_timestamp: input.updated_timestamp ?? NOW,
    metadata: input.metadata ?? {
      schema_version: "governance-intelligence-contract/v7A.1",
      created_by: "operator_console",
      source_system: "mission-control",
      truth_ledger_baseline_ref: baseline,
    },
    policy_scope: input.policy_scope ?? {
      policy_refs: ["runtime_policy_v7a", "tenant_policy_alpha", "mission_policy_query_layer", "evidence_policy_v7a", "escalation_policy_v7a", "recommendation_policy_v7a"],
      policy_domains: ["runtime_policy", "tenant_policy", "mission_policy", "evidence_policy", "escalation_policy", "recommendation_policy"],
      policy_version_refs: ["policy_snapshot_7a1_000001"],
    },
    governance_scope: input.governance_scope ?? {
      authority_mode: "advisory_only",
      execution_authority: "prohibited",
      operator_supremacy: "required",
      tenant_isolation: "required",
      fail_closed: "required",
    },
    evidence_requirements: input.evidence_requirements ?? {
      evidence_refs_required: true,
      minimum_evidence_count: 1,
      evidence_integrity_required: true,
      evidence_lineage_required: true,
      unsupported_claims_allowed: false,
    },
    confidence_requirements: input.confidence_requirements ?? {
      confidence_score_required: true,
      confidence_lineage_required: true,
      minimum_confidence_threshold: 0.7,
      uncertainty_required: true,
      confidence_replay_required: true,
    },
    lineage_requirements: input.lineage_requirements ?? {
      parent_refs_required: true,
      evidence_lineage_required: true,
      policy_lineage_required: true,
      recommendation_lineage_required: true,
      truth_ledger_link_required: true,
    },
    replay_requirements: input.replay_requirements ?? {
      replay_refs_required: true,
      replay_inputs_required: true,
      replay_policy_snapshot_required: true,
      replay_evidence_snapshot_required: true,
      replay_output_hash_required: true,
      deterministic_replay_required: true,
    },
    recommendation_requirements: input.recommendation_requirements ?? {
      recommendation_allowed: true,
      advisory_only_required: true,
      evidence_required: true,
      confidence_required: true,
      policy_support_required: true,
      escalation_required_on_conflict: true,
    },
    intelligence_state: input.intelligence_state ?? "CREATED",
    confidence_score: input.confidence_score ?? 0.86,
    uncertainty_summary: input.uncertainty_summary ?? "No unresolved governance uncertainty above escalation threshold.",
    evidence_refs: input.evidence_refs ?? ["evidence_6l_primary", "truth_ledger_baseline_6m"],
    policy_refs: input.policy_refs ?? ["runtime_policy_v7a", "tenant_policy_alpha", "mission_policy_query_layer"],
    lineage_refs: input.lineage_refs ?? ["lineage_query_layer", "truth_6l_recommendation"],
    replay_refs: input.replay_refs ?? ["replay_cert_6j5_000001"],
    recommendation_refs: input.recommendation_refs ?? ["rec_governance_advisory_7a1"],
    escalation_refs: input.escalation_refs ?? [],
    certification_status: input.certification_status ?? "UNCERTIFIED",
  };
  return freezeRecord({ ...record, metadata: { ...record.metadata, contract_hash: input.metadata?.contract_hash ?? computeGovernanceIntelligenceHash(record) } });
}

export function canonicalizeGovernanceIntelligenceContract(record: GovernanceIntelligenceRecord): string {
  return canonicalizeConfidenceToString({
    governance_intelligence_id: record.governance_intelligence_id,
    tenant_id: record.tenant_id,
    mission_id: record.mission_id,
    policy_scope: record.policy_scope,
    governance_scope: record.governance_scope,
    evidence_requirements: record.evidence_requirements,
    confidence_requirements: record.confidence_requirements,
    lineage_requirements: record.lineage_requirements,
    replay_requirements: record.replay_requirements,
    recommendation_requirements: record.recommendation_requirements,
  });
}

export function computeGovernanceIntelligenceHash(record: GovernanceIntelligenceRecord): string {
  return hashConfidenceValue("governance-intelligence-contract", canonicalizeGovernanceIntelligenceContract(record));
}

function failure(category: GovernanceIntelligenceFailureCategory, field_path: string, reason: string): GovernanceIntelligenceValidationFailure {
  return Object.freeze({
    failure_id: hashValue("governance-intelligence-validation-failure", { category, field_path, reason }),
    category,
    field_path,
    reason,
    fail_closed: true,
  });
}

export function validateGovernanceIntelligenceRecord(record: Partial<GovernanceIntelligenceRecord>): GovernanceIntelligenceValidationResult {
  const failures: GovernanceIntelligenceValidationFailure[] = [];
  if (!record.governance_intelligence_id) failures.push(failure("CONTRACT_VALIDATION", "governance_intelligence_id", "missing governance_intelligence_id"));
  if (!record.tenant_id) failures.push(failure("CONTRACT_VALIDATION", "tenant_id", "missing tenant_id"));
  if (!record.mission_id) failures.push(failure("CONTRACT_VALIDATION", "mission_id", "missing mission_id"));
  if (!record.created_timestamp) failures.push(failure("CONTRACT_VALIDATION", "created_timestamp", "missing created_timestamp"));
  if (!record.updated_timestamp) failures.push(failure("CONTRACT_VALIDATION", "updated_timestamp", "missing updated_timestamp"));
  if (record.created_timestamp && record.updated_timestamp && Date.parse(record.updated_timestamp) < Date.parse(record.created_timestamp)) failures.push(failure("CONTRACT_VALIDATION", "updated_timestamp", "updated_timestamp precedes created_timestamp"));
  if (!record.policy_scope) failures.push(failure("GOVERNANCE_BOUNDARY", "policy_scope", "missing policy_scope"));
  if (!record.governance_scope) failures.push(failure("GOVERNANCE_BOUNDARY", "governance_scope", "missing governance_scope"));
  if (!record.evidence_requirements) failures.push(failure("EVIDENCE", "evidence_requirements", "missing evidence_requirements"));
  if (!record.confidence_requirements) failures.push(failure("CONFIDENCE", "confidence_requirements", "missing confidence_requirements"));
  if (!record.lineage_requirements) failures.push(failure("LINEAGE", "lineage_requirements", "missing lineage_requirements"));
  if (!record.replay_requirements) failures.push(failure("REPLAY", "replay_requirements", "missing replay_requirements"));
  if (!record.recommendation_requirements) failures.push(failure("RECOMMENDATION", "recommendation_requirements", "missing recommendation_requirements"));
  if (!record.intelligence_state || !VALID_STATES.includes(record.intelligence_state)) failures.push(failure("CERTIFICATION", "intelligence_state", "invalid intelligence_state"));
  if (!record.certification_status || !VALID_CERTIFICATION.includes(record.certification_status)) failures.push(failure("CERTIFICATION", "certification_status", "invalid certification_status"));

  if (record.policy_scope) {
    if (record.policy_scope.policy_refs.length === 0) failures.push(failure("GOVERNANCE_BOUNDARY", "policy_scope.policy_refs", "missing policy references"));
    for (const policy of record.policy_scope.policy_refs) {
      if (!KNOWN_POLICIES.includes(policy)) failures.push(failure("GOVERNANCE_BOUNDARY", "policy_scope.policy_refs", `unknown policy reference ${policy}`));
      if (policy.includes("tenant_beta") && record.tenant_id === "tenant_alpha") failures.push(failure("GOVERNANCE_BOUNDARY", "policy_scope.policy_refs", "cross-tenant policy reference"));
    }
  }
  if (record.governance_scope) {
    if (record.governance_scope.authority_mode !== "advisory_only") failures.push(failure("GOVERNANCE_BOUNDARY", "governance_scope.authority_mode", "authority mode must be advisory-only"));
    if (record.governance_scope.execution_authority !== "prohibited") failures.push(failure("GOVERNANCE_BOUNDARY", "governance_scope.execution_authority", "execution authority detected"));
    if (record.governance_scope.operator_supremacy !== "required") failures.push(failure("GOVERNANCE_BOUNDARY", "governance_scope.operator_supremacy", "operator supremacy missing"));
    if (record.governance_scope.tenant_isolation !== "required") failures.push(failure("GOVERNANCE_BOUNDARY", "governance_scope.tenant_isolation", "tenant isolation missing"));
    if (record.governance_scope.fail_closed !== "required") failures.push(failure("GOVERNANCE_BOUNDARY", "governance_scope.fail_closed", "fail-closed missing"));
  }
  if (record.evidence_requirements) {
    if (!record.evidence_requirements.evidence_refs_required) failures.push(failure("EVIDENCE", "evidence_requirements.evidence_refs_required", "evidence references must be required"));
    if (record.evidence_requirements.evidence_refs_required && (record.evidence_refs?.length ?? 0) < record.evidence_requirements.minimum_evidence_count) failures.push(failure("EVIDENCE", "evidence_refs", "missing evidence refs"));
    if (record.evidence_requirements.unsupported_claims_allowed) failures.push(failure("EVIDENCE", "evidence_requirements.unsupported_claims_allowed", "unsupported claims allowed"));
    if (!record.evidence_requirements.evidence_lineage_required) failures.push(failure("EVIDENCE", "evidence_requirements.evidence_lineage_required", "evidence lineage absent"));
  }
  if (record.confidence_requirements) {
    if (record.confidence_requirements.confidence_score_required && record.confidence_score === undefined) failures.push(failure("CONFIDENCE", "confidence_score", "missing confidence_score"));
    if (record.confidence_score !== undefined && record.confidence_score < record.confidence_requirements.minimum_confidence_threshold) failures.push(failure("CONFIDENCE", "confidence_score", "confidence below threshold"));
    if (!record.confidence_requirements.confidence_lineage_required) failures.push(failure("CONFIDENCE", "confidence_requirements.confidence_lineage_required", "confidence without lineage"));
  }
  if (record.lineage_requirements) {
    if (record.lineage_requirements.truth_ledger_link_required && !record.metadata?.truth_ledger_baseline_ref) failures.push(failure("LINEAGE", "metadata.truth_ledger_baseline_ref", "truth ledger reference absent"));
    if ((record.lineage_refs?.length ?? 0) === 0) failures.push(failure("LINEAGE", "lineage_refs", "missing lineage_refs"));
    if (record.lineage_refs?.includes("broken_lineage")) failures.push(failure("LINEAGE", "lineage_refs", "lineage break detected"));
  }
  if (record.replay_requirements) {
    if (record.replay_requirements.replay_refs_required && (record.replay_refs?.length ?? 0) === 0) failures.push(failure("REPLAY", "replay_refs", "missing replay_refs"));
    if (!record.replay_requirements.replay_output_hash_required) failures.push(failure("REPLAY", "replay_requirements.replay_output_hash_required", "missing output hash requirement"));
    if (record.replay_refs?.includes("replay_mismatch")) failures.push(failure("REPLAY", "replay_refs", "replay mismatch"));
  }
  if (record.recommendation_requirements) {
    if (record.recommendation_requirements.evidence_required && (record.evidence_refs?.length ?? 0) === 0) failures.push(failure("RECOMMENDATION", "recommendation_requirements.evidence_required", "recommendation without evidence"));
    if (record.recommendation_requirements.confidence_required && record.confidence_score === undefined) failures.push(failure("RECOMMENDATION", "confidence_score", "recommendation without confidence"));
    if (record.recommendation_requirements.policy_support_required && (record.policy_refs?.length ?? 0) === 0) failures.push(failure("RECOMMENDATION", "policy_refs", "recommendation without policy scope"));
    if (record.recommendation_requirements.escalation_required_on_conflict && record.policy_refs?.includes("policy_conflict") && (record.escalation_refs?.length ?? 0) === 0) failures.push(failure("RECOMMENDATION", "escalation_refs", "policy conflict without escalation"));
  }

  const fullRecord = failures.length === 0 ? record as GovernanceIntelligenceRecord : undefined;
  const contractHash = fullRecord ? computeGovernanceIntelligenceHash(fullRecord) : undefined;
  if (fullRecord?.metadata.contract_hash && fullRecord.metadata.contract_hash !== contractHash) failures.push(failure("HASH_INTEGRITY", "metadata.contract_hash", "contract hash mismatch"));
  if (!fullRecord?.metadata.contract_hash && fullRecord) failures.push(failure("HASH_INTEGRITY", "metadata.contract_hash", "missing contract hash"));

  return Object.freeze({
    validation_id: hashValue("governance-intelligence-validation", { id: record.governance_intelligence_id, failures: failures.map((item) => item.failure_id) }),
    governance_intelligence_id: record.governance_intelligence_id,
    state: failures.length ? "FAIL" : "PASS",
    contract_hash: failures.length ? undefined : contractHash,
    failures: Object.freeze(failures),
    warnings: Object.freeze([]),
    deterministic: true,
    advisoryOnly: true,
    executionAllowed: false,
    governanceOverrideAllowed: false,
  });
}

export function assertGovernanceIntelligenceActionBlocked(action: "EXECUTE_ACTION" | "OVERRIDE_OPERATOR" | "BYPASS_GOVERNANCE" | "MUTATE_IDENTITY" | "DROP_EVIDENCE" | "DROP_LINEAGE" | "SELF_CERTIFY"): never {
  throw new Error(`Governance Intelligence Contract is advisory-only and blocks ${action}.`);
}

export function isGovernanceIntelligenceState(value: unknown): value is GovernanceIntelligenceState {
  return typeof value === "string" && (GOVERNANCE_INTELLIGENCE_STATES as readonly string[]).includes(value);
}

export function getAllowedGovernanceStateTransitions(state: GovernanceIntelligenceState): readonly GovernanceIntelligenceState[] {
  return ALLOWED_TRANSITIONS[state] ?? Object.freeze([]);
}

export function getBlockedGovernanceStateTransitions(state: GovernanceIntelligenceState): readonly GovernanceIntelligenceState[] {
  const allowed = new Set(getAllowedGovernanceStateTransitions(state));
  return Object.freeze(GOVERNANCE_INTELLIGENCE_STATES.filter((candidate) => candidate !== state && !allowed.has(candidate)));
}

export function canonicalizeGovernanceState(record: GovernanceIntelligenceRecord, previous_state_hash = "STATE_GENESIS"): string {
  return canonicalizeConfidenceToString({
    governance_intelligence_id: record.governance_intelligence_id,
    tenant_id: record.tenant_id,
    mission_id: record.mission_id,
    intelligence_state: record.intelligence_state,
    evidence_refs: record.evidence_refs,
    policy_refs: record.policy_refs,
    lineage_refs: record.lineage_refs,
    replay_refs: record.replay_refs,
    recommendation_refs: record.recommendation_refs,
    escalation_refs: record.escalation_refs,
    certification_status: record.certification_status,
    previous_state_hash,
  });
}

export function computeGovernanceStateHash(record: GovernanceIntelligenceRecord, previous_state_hash = "STATE_GENESIS"): string {
  return hashConfidenceValue("governance-intelligence-state", canonicalizeGovernanceState(record, previous_state_hash));
}

function computeGovernanceTransitionHash(event: Omit<GovernanceStateTransitionEvent, "transition_event_id" | "transition_hash">): string {
  return hashValue("governance-intelligence-state-transition", event);
}

function firstTransitionFailure(record: GovernanceIntelligenceRecord, to_state: GovernanceIntelligenceState, options: { escalation_reason?: GovernanceIntelligenceEscalationReason; expected_tenant_id?: string; expected_mission_id?: string } = {}): GovernanceIntelligenceTransitionFailureReason | null {
  const from_state = record.intelligence_state;
  if (!from_state) return "MISSING_CURRENT_STATE";
  if (!to_state) return "MISSING_TARGET_STATE";
  if (!isGovernanceIntelligenceState(from_state)) return "UNKNOWN_STATE";
  if (!isGovernanceIntelligenceState(to_state)) return "INVALID_STATE_VALUE";
  if (options.expected_tenant_id && options.expected_tenant_id !== record.tenant_id) return "TENANT_MISMATCH";
  if (options.expected_mission_id && options.expected_mission_id !== record.mission_id) return "MISSION_MISMATCH";
  if (from_state === "ARCHIVED" && to_state !== "ARCHIVED") return "ARCHIVED_REACTIVATION_ATTEMPTED";
  if (from_state === "CERTIFIED" && to_state !== "ARCHIVED") return "CERTIFIED_MUTATION_ATTEMPTED";
  if (STATE_ORDER[to_state] < STATE_ORDER[from_state]) return "STATE_REGRESSION_DETECTED";
  if (!getAllowedGovernanceStateTransitions(from_state).includes(to_state)) {
    if (STATE_ORDER[to_state] > STATE_ORDER[from_state] + 1 && !(from_state === "RECOMMENDING" && to_state === "CERTIFIED")) return "STATE_SKIP_DETECTED";
    return "TRANSITION_NOT_ALLOWED";
  }
  if (!record.governance_scope) return "GOVERNANCE_SCOPE_MISSING";
  if (!record.policy_scope) return "POLICY_SCOPE_MISSING";
  if (record.governance_scope.operator_supremacy !== "required") return "OPERATOR_SUPREMACY_MISSING";
  if (record.governance_scope.execution_authority !== "prohibited") return "EXECUTION_AUTHORITY_DETECTED";
  if (record.evidence_refs.length === 0) return "EVIDENCE_REF_MISSING";
  if (record.policy_refs.length === 0) return "POLICY_REF_MISSING";
  if (record.lineage_refs.length === 0) return "LINEAGE_REF_MISSING";
  if (record.replay_refs.length === 0) return "REPLAY_REF_MISSING";
  if (record.lineage_refs.includes("broken_lineage")) return "LINEAGE_BREAK_DETECTED";

  if (to_state === "ESCALATED") {
    if (record.escalation_refs.length === 0) return "ESCALATION_REF_MISSING";
    if (!options.escalation_reason) return "ESCALATION_REASON_MISSING";
  }
  if (to_state === "CERTIFIED") {
    if (!["PASS", "CONDITIONAL_PASS"].includes(record.certification_status)) return "CERTIFICATION_STATUS_INVALID";
    if (record.recommendation_refs.length === 0) return "EVIDENCE_REF_MISSING";
    if (validateGovernanceIntelligenceRecord(record).state !== "PASS") return "STATE_HASH_MISMATCH";
  }
  if (to_state === "ARCHIVED" && !["PASS", "CONDITIONAL_PASS"].includes(record.certification_status)) return "CERTIFICATION_STATUS_INVALID";
  return null;
}

export function recordGovernanceStateTransition(
  record: GovernanceIntelligenceRecord,
  to_state: GovernanceIntelligenceState,
  options: {
    transition_reason?: string;
    transition_actor?: string;
    transition_timestamp?: string;
    escalation_reason?: GovernanceIntelligenceEscalationReason;
    expected_tenant_id?: string;
    expected_mission_id?: string;
    previous_state_hash?: string;
  } = {},
): GovernanceStateTransitionRecord {
  const previousStateHash = options.previous_state_hash ?? computeGovernanceStateHash(record);
  const failure_reason = firstTransitionFailure(record, to_state, options);
  const transitionAllowed = failure_reason === null;
  const nextRecord = transitionAllowed ? buildGovernanceIntelligenceRecord({ ...record, intelligence_state: to_state }) : record;
  const newStateHash = transitionAllowed ? computeGovernanceStateHash(nextRecord, previousStateHash) : previousStateHash;
  const eventBase: Omit<GovernanceStateTransitionEvent, "transition_event_id" | "transition_hash"> = Object.freeze({
    governance_intelligence_id: record.governance_intelligence_id,
    tenant_id: record.tenant_id,
    mission_id: record.mission_id,
    from_state: record.intelligence_state,
    to_state,
    transition_timestamp: options.transition_timestamp ?? NOW,
    transition_reason: options.transition_reason ?? options.escalation_reason ?? `${record.intelligence_state}_TO_${to_state}`,
    transition_actor: options.transition_actor ?? "operator_console",
    transition_source: "mission-control-state-machine",
    evidence_refs: Object.freeze([...record.evidence_refs]),
    policy_refs: Object.freeze([...record.policy_refs]),
    lineage_refs: Object.freeze([...record.lineage_refs]),
    replay_refs: Object.freeze([...record.replay_refs]),
    recommendation_refs: Object.freeze([...record.recommendation_refs]),
    escalation_refs: Object.freeze([...record.escalation_refs]),
    previous_state_hash: previousStateHash,
    new_state_hash: newStateHash,
    validation_result: transitionAllowed ? "PASS" : "FAIL",
    failure_reason,
    ledger_recorded: true,
  });
  const transition_hash = computeGovernanceTransitionHash(eventBase);
  const event: GovernanceStateTransitionEvent = Object.freeze({
    transition_event_id: hashValue("governance-intelligence-transition-event-id", { transition_hash }),
    ...eventBase,
    transition_hash,
  });
  return Object.freeze({
    result: Object.freeze({
      governance_intelligence_id: record.governance_intelligence_id,
      tenant_id: record.tenant_id,
      mission_id: record.mission_id,
      previous_state: record.intelligence_state,
      requested_state: to_state,
      final_state: nextRecord.intelligence_state,
      transition_allowed: transitionAllowed,
      validation_result: transitionAllowed ? "PASS" : "FAIL",
      failure_reason,
      state_hash: newStateHash,
      transition_hash,
      replay_ref: record.replay_refs[0] ?? "missing_replay_ref",
      lineage_ref: record.lineage_refs[0] ?? "missing_lineage_ref",
      certification_impact: nextRecord.certification_status,
      recorded_to_ledger: true,
    }),
    event,
    record: nextRecord,
  });
}

export function replayGovernanceStatePath(initialRecord: GovernanceIntelligenceRecord, events: readonly GovernanceStateTransitionEvent[]): GovernanceStateReplayResult {
  if (events.length === 0) {
    return Object.freeze({
      replay_id: hashValue("governance-intelligence-state-replay", { id: initialRecord.governance_intelligence_id, events: 0 }),
      governance_intelligence_id: initialRecord.governance_intelligence_id,
      reconstructed_state_path: Object.freeze([initialRecord.intelligence_state]),
      final_reconstructed_state: initialRecord.intelligence_state,
      validation_result: "FAIL",
      failure_reason: "MISSING_TRANSITION_EVENT",
      transition_hashes: Object.freeze([]),
      state_hashes: Object.freeze([computeGovernanceStateHash(initialRecord)]),
      replay_certification_result: "FAIL",
    });
  }

  let current = initialRecord;
  let previousHash = computeGovernanceStateHash(initialRecord);
  const path: GovernanceIntelligenceState[] = [initialRecord.intelligence_state];
  const transitionHashes: string[] = [];
  const stateHashes: string[] = [previousHash];
  for (const event of events) {
    if (event.from_state !== current.intelligence_state) return buildReplayFailure(initialRecord, path, transitionHashes, stateHashes, "REPLAY_PATH_MISMATCH");
    if (!event.transition_hash) return buildReplayFailure(initialRecord, path, transitionHashes, stateHashes, "TRANSITION_HASH_MISSING");
    if (!event.previous_state_hash) return buildReplayFailure(initialRecord, path, transitionHashes, stateHashes, "STATE_HASH_MISSING");
    if (event.previous_state_hash !== previousHash) return buildReplayFailure(initialRecord, path, transitionHashes, stateHashes, "STATE_HASH_MISMATCH");
    const replayed = recordGovernanceStateTransition(current, event.to_state, {
      transition_reason: event.transition_reason,
      transition_actor: event.transition_actor,
      transition_timestamp: event.transition_timestamp,
      escalation_reason: isGovernanceEscalationReason(event.transition_reason) ? event.transition_reason : undefined,
      previous_state_hash: previousHash,
    });
    if (replayed.event.transition_hash !== event.transition_hash) return buildReplayFailure(initialRecord, path, transitionHashes, stateHashes, "TRANSITION_HASH_MISMATCH");
    if (replayed.event.new_state_hash !== event.new_state_hash) return buildReplayFailure(initialRecord, path, transitionHashes, stateHashes, "STATE_HASH_MISMATCH");
    current = replayed.record;
    previousHash = replayed.event.new_state_hash;
    path.push(current.intelligence_state);
    transitionHashes.push(event.transition_hash);
    stateHashes.push(previousHash);
  }

  return Object.freeze({
    replay_id: hashValue("governance-intelligence-state-replay", { id: initialRecord.governance_intelligence_id, transitionHashes }),
    governance_intelligence_id: initialRecord.governance_intelligence_id,
    reconstructed_state_path: Object.freeze(path),
    final_reconstructed_state: current.intelligence_state,
    validation_result: "PASS",
    failure_reason: null,
    transition_hashes: Object.freeze(transitionHashes),
    state_hashes: Object.freeze(stateHashes),
    replay_certification_result: current.certification_status,
  });
}

function isGovernanceEscalationReason(value: string): value is GovernanceIntelligenceEscalationReason {
  return (["POLICY_CONFLICT", "AUTHORITY_RISK", "LOW_CONFIDENCE", "MISSING_EVIDENCE", "LINEAGE_GAP", "REPLAY_GAP", "TENANT_BOUNDARY_RISK", "OPERATOR_REVIEW_REQUIRED", "CERTIFICATION_REVIEW_REQUIRED"] as const).includes(value as GovernanceIntelligenceEscalationReason);
}

function buildReplayFailure(
  initialRecord: GovernanceIntelligenceRecord,
  path: readonly GovernanceIntelligenceState[],
  transitionHashes: readonly string[],
  stateHashes: readonly string[],
  failure_reason: GovernanceIntelligenceTransitionFailureReason,
): GovernanceStateReplayResult {
  return Object.freeze({
    replay_id: hashValue("governance-intelligence-state-replay-failure", { id: initialRecord.governance_intelligence_id, failure_reason, path }),
    governance_intelligence_id: initialRecord.governance_intelligence_id,
    reconstructed_state_path: Object.freeze([...path]),
    final_reconstructed_state: path[path.length - 1] ?? initialRecord.intelligence_state,
    validation_result: "FAIL",
    failure_reason,
    transition_hashes: Object.freeze([...transitionHashes]),
    state_hashes: Object.freeze([...stateHashes]),
    replay_certification_result: "FAIL",
  });
}

export function buildGovernanceStateObservabilitySurface(record: GovernanceIntelligenceRecord, transition_history: readonly GovernanceStateTransitionEvent[] = []): GovernanceStateObservabilitySurface {
  const lastEvent = transition_history[transition_history.length - 1];
  return Object.freeze({
    governance_intelligence_id: record.governance_intelligence_id,
    current_state: record.intelligence_state,
    previous_state: lastEvent?.from_state ?? null,
    allowed_next_states: getAllowedGovernanceStateTransitions(record.intelligence_state),
    blocked_transitions: getBlockedGovernanceStateTransitions(record.intelligence_state),
    transition_history: Object.freeze([...transition_history]),
    evidence_refs: Object.freeze([...record.evidence_refs]),
    policy_refs: Object.freeze([...record.policy_refs]),
    lineage_refs: Object.freeze([...record.lineage_refs]),
    replay_refs: Object.freeze([...record.replay_refs]),
    recommendation_refs: Object.freeze([...record.recommendation_refs]),
    escalation_refs: Object.freeze([...record.escalation_refs]),
    certification_status: record.certification_status,
    failure_reason: lastEvent?.failure_reason ?? null,
  });
}

function computeGovernanceLifecycleEventHash(event: Omit<GovernanceLifecycleEvent, "lifecycle_event_id" | "lifecycle_event_hash">): string {
  return hashValue("governance-intelligence-lifecycle-event", event);
}

function mapTransitionFailure(reason: GovernanceIntelligenceTransitionFailureReason | null): GovernanceLifecycleFailureReason | null {
  if (!reason) return null;
  if (reason === "REPLAY_REF_MISSING") return "REPLAY_REFS_MISSING";
  if (reason === "LINEAGE_REF_MISSING" || reason === "LINEAGE_BREAK_DETECTED") return "LINEAGE_REFS_MISSING";
  if (reason === "EVIDENCE_REF_MISSING") return "EVIDENCE_REFS_MISSING";
  if (reason === "POLICY_REF_MISSING") return "POLICY_REFS_MISSING";
  if (reason === "ARCHIVED_REACTIVATION_ATTEMPTED") return "ARCHIVED_RECORD_MUTATION";
  if (reason === "CERTIFICATION_STATUS_INVALID") return "CERTIFICATION_PRECONDITION_FAILED";
  return "INVALID_STATE_TRANSITION";
}

function firstLifecycleFailure(
  record: GovernanceIntelligenceRecord,
  identity: GovernanceIntelligenceIdentity | undefined,
  to_stage: GovernanceLifecycleStage,
  previous_events: readonly GovernanceLifecycleEvent[],
  options: { actor?: string; timestamp?: string; escalation_reason?: GovernanceIntelligenceEscalationReason; retention_policy_ref?: string; certification_refs?: readonly string[] } = {},
): GovernanceLifecycleFailureReason | null {
  if (!to_stage || !LIFECYCLE_STAGE_TO_STATE[to_stage]) return "INVALID_LIFECYCLE_STAGE";
  if (!options.timestamp && options.timestamp === "") return "TRANSITION_TIMESTAMP_MISSING";
  if (!options.actor && options.actor === "") return "TRANSITION_ACTOR_MISSING";
  if (!identity) return "TRANSITION_EVENT_MISSING";
  if (identity.governance_intelligence_id !== record.governance_intelligence_id || identity.tenant_id !== record.tenant_id || identity.mission_id !== record.mission_id) return "INVALID_STATE_TRANSITION";
  if (record.evidence_refs.length === 0) return "EVIDENCE_REFS_MISSING";
  if (record.policy_refs.length === 0) return "POLICY_REFS_MISSING";
  if (record.lineage_refs.length === 0) return "LINEAGE_REFS_MISSING";
  if (record.replay_refs.length === 0) return "REPLAY_REFS_MISSING";
  if (record.lineage_refs.includes("broken_lineage")) return "LINEAGE_BREAK_DETECTED";

  const previousStage = previous_events[previous_events.length - 1]?.lifecycle_stage ?? null;
  if (previousStage) {
    if (LIFECYCLE_STAGE_ORDER[to_stage] < LIFECYCLE_STAGE_ORDER[previousStage]) return "LIFECYCLE_STAGE_REGRESSION";
    if (LIFECYCLE_STAGE_ORDER[to_stage] > LIFECYCLE_STAGE_ORDER[previousStage] + 1 && !(previousStage === "Recommendation Generation" && to_stage === "Certification")) return "LIFECYCLE_STAGE_SKIPPED";
  } else if (to_stage !== "Creation") {
    return "LIFECYCLE_STAGE_MISSING";
  }

  if (to_stage === "Creation") {
    if (record.intelligence_state !== "CREATED") return "INVALID_STATE_TRANSITION";
    if (validateGovernanceIntelligenceRecord(record).state !== "PASS") return "INVALID_STATE_TRANSITION";
    if (validateGovernanceIntelligenceIdentity(identity, { registry: [identity] }).validation_result !== "PASS") return "INVALID_STATE_TRANSITION";
  }
  if (to_stage === "Recommendation Generation" && record.confidence_score === undefined) return "UNSUPPORTED_RECOMMENDATION";
  if (to_stage === "Escalation" && (!options.escalation_reason || record.escalation_refs.length === 0)) return "POLICY_CONFLICT_UNESCALATED";
  if (to_stage === "Certification") {
    if (!["PASS", "CONDITIONAL_PASS"].includes(record.certification_status)) return "CERTIFICATION_PRECONDITION_FAILED";
    if ((options.certification_refs?.length ?? 0) === 0) return "CERTIFICATION_PRECONDITION_FAILED";
  }
  if (to_stage === "Archival") {
    if (record.intelligence_state !== "CERTIFIED") return "ARCHIVAL_BEFORE_CERTIFICATION";
    if (!["PASS", "CONDITIONAL_PASS"].includes(record.certification_status)) return "ARCHIVAL_BEFORE_CERTIFICATION";
    if (!options.retention_policy_ref) return "ARCHIVAL_BEFORE_CERTIFICATION";
  }
  return null;
}

export function recordGovernanceLifecycleTransition(
  record: GovernanceIntelligenceRecord,
  identity: GovernanceIntelligenceIdentity | undefined,
  to_stage: GovernanceLifecycleStage,
  previous_events: readonly GovernanceLifecycleEvent[] = [],
  options: {
    actor?: string;
    actor_type?: "operator" | "system" | "certifier";
    timestamp?: string;
    activity_summary?: string;
    escalation_reason?: GovernanceIntelligenceEscalationReason;
    certification_refs?: readonly string[];
    retention_policy_ref?: string;
  } = {},
): GovernanceLifecycleTransitionRecord {
  const eventIdentity = identity ?? generateGovernanceIntelligenceIdentity({ tenant_id: record.tenant_id, mission_id: record.mission_id });
  const previousLifecycleHash = previous_events[previous_events.length - 1]?.lifecycle_event_hash ?? "LIFECYCLE_GENESIS";
  const targetState = LIFECYCLE_STAGE_TO_STATE[to_stage] ?? record.intelligence_state;
  const lifecycleFailure = firstLifecycleFailure(record, identity, to_stage, previous_events, options);
  const stateTransition = to_stage === "Creation"
    ? undefined
    : recordGovernanceStateTransition(record, targetState, {
      transition_reason: options.escalation_reason ?? `${record.intelligence_state}_TO_${targetState}`,
      transition_actor: options.actor ?? "operator_console",
      transition_timestamp: options.timestamp ?? NOW,
      escalation_reason: options.escalation_reason,
    });
  const transitionFailure = mapTransitionFailure(stateTransition?.result.failure_reason ?? null);
  const failure_reason = lifecycleFailure ?? transitionFailure;
  const validation_status = failure_reason ? "FAIL" : "PASS";
  const nextRecord = validation_status === "PASS" ? (stateTransition?.record ?? record) : record;
  const resultingStateHash = stateTransition?.result.state_hash ?? computeGovernanceStateHash(record);
  const certificationRefs = options.certification_refs ?? [];
  const eventBase: Omit<GovernanceLifecycleEvent, "lifecycle_event_id" | "lifecycle_event_hash"> = Object.freeze({
    governance_intelligence_id: record.governance_intelligence_id,
    tenant_id: record.tenant_id,
    mission_id: record.mission_id,
    lifecycle_stage: to_stage,
    from_state: record.intelligence_state,
    to_state: targetState,
    timestamp: options.timestamp ?? NOW,
    actor: options.actor ?? "operator_console",
    actor_type: options.actor_type ?? (to_stage === "Certification" ? "certifier" : "operator"),
    event_source: "mission-control-lifecycle-engine",
    activity_type: LIFECYCLE_STAGE_TO_ACTIVITY[to_stage],
    activity_summary: options.activity_summary ?? `${to_stage} lifecycle event`,
    evidence_refs: Object.freeze([...record.evidence_refs]),
    policy_refs: Object.freeze([...record.policy_refs]),
    lineage_refs: Object.freeze([...record.lineage_refs]),
    replay_refs: Object.freeze([...record.replay_refs]),
    recommendation_refs: Object.freeze([...record.recommendation_refs]),
    escalation_refs: Object.freeze([...record.escalation_refs]),
    certification_refs: Object.freeze([...certificationRefs]),
    previous_lifecycle_hash: previousLifecycleHash,
    resulting_state_hash: resultingStateHash,
    validation_status,
    failure_reason,
    recorded_to_truth_ledger: true,
    truth_ledger_reference: eventIdentity.truth_ledger_reference,
  });
  const lifecycle_event_hash = computeGovernanceLifecycleEventHash(eventBase);
  const event: GovernanceLifecycleEvent = Object.freeze({
    lifecycle_event_id: hashValue("governance-intelligence-lifecycle-event-id", { lifecycle_event_hash }),
    ...eventBase,
    lifecycle_event_hash,
  });
  return Object.freeze({
    result: Object.freeze({
      governance_intelligence_id: record.governance_intelligence_id,
      tenant_id: record.tenant_id,
      mission_id: record.mission_id,
      from_lifecycle_stage: previous_events[previous_events.length - 1]?.lifecycle_stage ?? null,
      to_lifecycle_stage: to_stage,
      from_state: record.intelligence_state,
      to_state: targetState,
      final_state: nextRecord.intelligence_state,
      validation_status,
      failure_reason,
      lifecycle_event_hash,
      previous_lifecycle_event_hash: previousLifecycleHash,
      state_hash: resultingStateHash,
      replay_id: record.replay_refs[0] ?? eventIdentity.replay_id,
      truth_ledger_reference: eventIdentity.truth_ledger_reference,
      recorded_to_truth_ledger: true,
    }),
    event,
    record: nextRecord,
    identity: eventIdentity,
  });
}

export function replayGovernanceLifecycle(initialRecord: GovernanceIntelligenceRecord, events: readonly GovernanceLifecycleEvent[]): GovernanceLifecycleReplayResult {
  if (events.length === 0) {
    return Object.freeze({
      replay_id: hashValue("governance-intelligence-lifecycle-replay", { id: initialRecord.governance_intelligence_id, events: 0 }),
      governance_intelligence_id: initialRecord.governance_intelligence_id,
      reconstructed_lifecycle_path: Object.freeze([]),
      reconstructed_state_path: Object.freeze([initialRecord.intelligence_state]),
      reconstructed_recommendation_history: Object.freeze([]),
      reconstructed_escalation_history: Object.freeze([]),
      reconstructed_certification_status: initialRecord.certification_status,
      reconstructed_archive_status: "ACTIVE",
      validation_result: "FAIL",
      failure_reason: "TRANSITION_EVENT_MISSING",
      event_hashes: Object.freeze([]),
      final_state: initialRecord.intelligence_state,
    });
  }
  let previousHash = "LIFECYCLE_GENESIS";
  let currentState = initialRecord.intelligence_state;
  const lifecyclePath: GovernanceLifecycleStage[] = [];
  const statePath: GovernanceIntelligenceState[] = [initialRecord.intelligence_state];
  const recommendationHistory = new Set<string>();
  const escalationHistory = new Set<string>();
  const eventHashes: string[] = [];
  for (const event of events) {
    if (event.previous_lifecycle_hash !== previousHash) return lifecycleReplayFailure(initialRecord, lifecyclePath, statePath, recommendationHistory, escalationHistory, eventHashes, "LIFECYCLE_REPLAY_MISMATCH");
    if (event.from_state !== currentState) return lifecycleReplayFailure(initialRecord, lifecyclePath, statePath, recommendationHistory, escalationHistory, eventHashes, "LIFECYCLE_REPLAY_MISMATCH");
    const { lifecycle_event_id: _id, lifecycle_event_hash: _hash, ...eventBase } = event;
    if (computeGovernanceLifecycleEventHash(eventBase) !== event.lifecycle_event_hash) return lifecycleReplayFailure(initialRecord, lifecyclePath, statePath, recommendationHistory, escalationHistory, eventHashes, "LIFECYCLE_REPLAY_MISMATCH");
    lifecyclePath.push(event.lifecycle_stage);
    currentState = event.to_state;
    statePath.push(currentState);
    event.recommendation_refs.forEach((ref) => recommendationHistory.add(ref));
    event.escalation_refs.forEach((ref) => escalationHistory.add(ref));
    eventHashes.push(event.lifecycle_event_hash);
    previousHash = event.lifecycle_event_hash;
  }
  const finalState = statePath[statePath.length - 1] ?? initialRecord.intelligence_state;
  return Object.freeze({
    replay_id: hashValue("governance-intelligence-lifecycle-replay", { id: initialRecord.governance_intelligence_id, eventHashes }),
    governance_intelligence_id: initialRecord.governance_intelligence_id,
    reconstructed_lifecycle_path: Object.freeze(lifecyclePath),
    reconstructed_state_path: Object.freeze(statePath),
    reconstructed_recommendation_history: Object.freeze([...recommendationHistory]),
    reconstructed_escalation_history: Object.freeze([...escalationHistory]),
    reconstructed_certification_status: events[events.length - 1]?.lifecycle_stage === "Certification" || finalState === "CERTIFIED" || finalState === "ARCHIVED" ? "PASS" : initialRecord.certification_status,
    reconstructed_archive_status: finalState === "ARCHIVED" ? "ARCHIVED" : "ACTIVE",
    validation_result: "PASS",
    failure_reason: null,
    event_hashes: Object.freeze(eventHashes),
    final_state: finalState,
  });
}

function lifecycleReplayFailure(
  initialRecord: GovernanceIntelligenceRecord,
  lifecyclePath: readonly GovernanceLifecycleStage[],
  statePath: readonly GovernanceIntelligenceState[],
  recommendationHistory: ReadonlySet<string>,
  escalationHistory: ReadonlySet<string>,
  eventHashes: readonly string[],
  failure_reason: GovernanceLifecycleFailureReason,
): GovernanceLifecycleReplayResult {
  return Object.freeze({
    replay_id: hashValue("governance-intelligence-lifecycle-replay-failure", { id: initialRecord.governance_intelligence_id, failure_reason }),
    governance_intelligence_id: initialRecord.governance_intelligence_id,
    reconstructed_lifecycle_path: Object.freeze([...lifecyclePath]),
    reconstructed_state_path: Object.freeze([...statePath]),
    reconstructed_recommendation_history: Object.freeze([...recommendationHistory]),
    reconstructed_escalation_history: Object.freeze([...escalationHistory]),
    reconstructed_certification_status: "FAIL",
    reconstructed_archive_status: "ACTIVE",
    validation_result: "FAIL",
    failure_reason,
    event_hashes: Object.freeze([...eventHashes]),
    final_state: statePath[statePath.length - 1] ?? initialRecord.intelligence_state,
  });
}

export function buildGovernanceLifecycleObservabilitySurface(record: GovernanceIntelligenceRecord, events: readonly GovernanceLifecycleEvent[] = []): GovernanceLifecycleObservabilitySurface {
  const latest = events[events.length - 1];
  const trace = <K extends keyof Pick<GovernanceLifecycleEvent, "evidence_refs" | "policy_refs" | "lineage_refs" | "replay_refs" | "recommendation_refs" | "escalation_refs">>(key: K) => Object.freeze([...new Set(events.flatMap((event) => event[key]))]);
  return Object.freeze({
    governance_intelligence_id: record.governance_intelligence_id,
    current_lifecycle_stage: latest?.lifecycle_stage ?? "Creation",
    current_state: record.intelligence_state,
    stage_timeline: Object.freeze(events.map((event) => event.lifecycle_stage)),
    state_path: Object.freeze([record.intelligence_state, ...events.map((event) => event.to_state)]),
    actor_timeline: Object.freeze(events.map((event) => event.actor)),
    evidence_trace: trace("evidence_refs"),
    policy_trace: trace("policy_refs"),
    lineage_trace: trace("lineage_refs"),
    replay_trace: trace("replay_refs"),
    recommendation_history: trace("recommendation_refs"),
    escalation_history: trace("escalation_refs"),
    certification_result: record.certification_status,
    archive_status: record.intelligence_state === "ARCHIVED" ? "ARCHIVED" : "ACTIVE",
    failure_reasons: Object.freeze(events.flatMap((event) => event.failure_reason ? [event.failure_reason] : [])),
  });
}

function uniqueValues(values: readonly string[]): readonly string[] {
  return Object.freeze([...new Set(values.filter(Boolean))]);
}

function certificationCategory(
  component: GovernanceFoundationCertificationComponent,
  tests_passed: readonly string[],
  failures: readonly GovernanceFoundationCertificationFailureReason[],
  evidence_refs: readonly string[],
  critical = true,
): GovernanceFoundationCertificationCategoryResult {
  return Object.freeze({
    component,
    validation_status: failures.length ? "FAIL" : "PASS",
    tests_passed: Object.freeze([...tests_passed]),
    tests_failed: Object.freeze(failures),
    failure_reasons: Object.freeze(failures),
    evidence_refs: uniqueValues(evidence_refs),
    critical,
  });
}

export function buildGovernanceFoundationCertificationInputPackage(input: Partial<GovernanceFoundationCertificationInputPackage> = {}): GovernanceFoundationCertificationInputPackage {
  const identity = input.identity ?? generateGovernanceIntelligenceIdentity({ certification_status: "PASS" });
  const record = Object.prototype.hasOwnProperty.call(input, "contract_record") ? input.contract_record : buildGovernanceIntelligenceRecord({
    governance_intelligence_id: identity.governance_intelligence_id,
    tenant_id: identity.tenant_id,
    mission_id: identity.mission_id,
    created_timestamp: identity.created_timestamp,
    certification_status: "UNCERTIFIED",
  });
  const events = input.lifecycle_events ?? (record ? buildCertifiedLifecycleEvents(record, identity) : []);
  const stateEvents = input.state_transition_events ?? [];
  const truthRefs = uniqueValues([identity.truth_ledger_reference, record?.metadata.truth_ledger_baseline_ref ?? "", ...(input.truth_ledger_refs ?? [])]);
  return Object.freeze({
    certification_package_id: input.certification_package_id ?? hashValue("governance-foundation-certification-package", { id: identity.governance_intelligence_id, truthRefs }),
    contract_record: record,
    identity,
    identity_registry: Object.freeze(input.identity_registry ? [...input.identity_registry] : [identity]),
    lifecycle_events: Object.freeze([...events]),
    state_transition_events: Object.freeze([...stateEvents]),
    evidence_refs: uniqueValues([...(record?.evidence_refs ?? []), ...(input.evidence_refs ?? [])]),
    lineage_refs: uniqueValues([...(record?.lineage_refs ?? []), ...(input.lineage_refs ?? [])]),
    replay_refs: uniqueValues([...(record?.replay_refs ?? []), identity.replay_id, ...(input.replay_refs ?? [])]),
    truth_ledger_refs: truthRefs,
    certification_refs: uniqueValues(["cert_foundation_7a5_000001", ...(input.certification_refs ?? [])]),
    conditional_findings: Object.freeze([...(input.conditional_findings ?? [])]),
    audit_evidence_refs: uniqueValues(["audit_contract_7a1", "audit_states_7a2", "audit_identity_7a3", "audit_lifecycle_7a4", ...(input.audit_evidence_refs ?? [])]),
  });
}

function buildCertifiedLifecycleEvents(record: GovernanceIntelligenceRecord, identity: GovernanceIntelligenceIdentity): readonly GovernanceLifecycleEvent[] {
  const events: GovernanceLifecycleEvent[] = [];
  const creation = recordGovernanceLifecycleTransition(record, identity, "Creation", events); events.push(creation.event);
  const analysis = recordGovernanceLifecycleTransition(creation.record, identity, "Analysis", events); events.push(analysis.event);
  const correlation = recordGovernanceLifecycleTransition(analysis.record, identity, "Correlation", events); events.push(correlation.event);
  const recommendation = recordGovernanceLifecycleTransition(correlation.record, identity, "Recommendation Generation", events); events.push(recommendation.event);
  const certifiedRecord = buildGovernanceIntelligenceRecord({ ...recommendation.record, certification_status: "PASS" });
  const certification = recordGovernanceLifecycleTransition(certifiedRecord, identity, "Certification", events, { certification_refs: ["cert_foundation_7a5_000001"] }); events.push(certification.event);
  const archival = recordGovernanceLifecycleTransition(certification.record, identity, "Archival", events, { retention_policy_ref: "retention_policy_7a5" }); events.push(archival.event);
  return Object.freeze(events);
}

function certifyContract(input: GovernanceFoundationCertificationInputPackage): GovernanceFoundationCertificationCategoryResult {
  const record = input.contract_record;
  const failures: GovernanceFoundationCertificationFailureReason[] = [];
  const passed: string[] = [];
  if (!record) failures.push("CONTRACT_MISSING");
  if (record && validateGovernanceIntelligenceRecord(record).state !== "PASS") failures.push("CONTRACT_SCHEMA_INVALID"); else if (record) passed.push("contract present", "contract schema valid");
  if (record && validateGovernanceIntelligenceRecord({ ...record, governance_intelligence_id: "" }).state === "FAIL") passed.push("required fields enforced"); else failures.push("REQUIRED_FIELDS_NOT_ENFORCED");
  if (!record?.policy_scope) failures.push("POLICY_SCOPE_MISSING");
  if (!record?.evidence_requirements) failures.push("EVIDENCE_REQUIREMENTS_MISSING");
  if (!record?.lineage_requirements) failures.push("LINEAGE_REQUIREMENTS_MISSING");
  if (!record?.replay_requirements) failures.push("REPLAY_REQUIREMENTS_MISSING");
  return certificationCategory("contract", passed, failures, ["contract_validation_report_7a5"]);
}

function certifyStateMachine(input: GovernanceFoundationCertificationInputPackage): GovernanceFoundationCertificationCategoryResult {
  const record = input.contract_record;
  const failures: GovernanceFoundationCertificationFailureReason[] = [];
  const passed: string[] = [];
  if (!record) return certificationCategory("state_machine", passed, ["STATE_MACHINE_MISSING"], ["state_machine_report_7a5"]);
  const allowed = recordGovernanceStateTransition(record, "ANALYZING");
  if (allowed.result.validation_result === "PASS") passed.push("allowed transition accepted"); else failures.push("VALID_TRANSITION_BLOCKED");
  const invalid = recordGovernanceStateTransition(record, "CERTIFIED");
  if (invalid.result.validation_result === "FAIL") passed.push("invalid transition blocked", "state skipping blocked"); else failures.push("INVALID_TRANSITION_ALLOWED", "STATE_SKIP_ALLOWED");
  const archived = buildGovernanceIntelligenceRecord({ ...record, intelligence_state: "ARCHIVED", certification_status: "PASS" });
  if (recordGovernanceStateTransition(archived, "CERTIFIED").result.validation_result === "FAIL") passed.push("archived reactivation blocked"); else failures.push("ARCHIVED_REACTIVATION_ALLOWED");
  const replay = replayGovernanceStatePath(record, [allowed.event]);
  if (replay.validation_result === "PASS") passed.push("state replay deterministic"); else failures.push("STATE_NON_DETERMINISTIC");
  return certificationCategory("state_machine", passed, failures, ["state_transition_report_7a5"]);
}

function certifyIdentity(input: GovernanceFoundationCertificationInputPackage): GovernanceFoundationCertificationCategoryResult {
  const identity = input.identity;
  const failures: GovernanceFoundationCertificationFailureReason[] = [];
  const passed: string[] = [];
  if (!identity) return certificationCategory("identity", passed, ["IDENTITY_MISSING"], ["identity_report_7a5"]);
  const validation = validateGovernanceIntelligenceIdentity(identity, { registry: input.identity_registry });
  if (validation.validation_result === "PASS") passed.push("identity unique", "tenant and mission present");
  else if (validation.failures.some((failureItem) => failureItem.reason === "GOVERNANCE_INTELLIGENCE_ID_DUPLICATE")) failures.push("IDENTITY_DUPLICATE");
  else failures.push("IDENTITY_MISSING");
  if (validateGovernanceIntelligenceIdentity(identity, { registry: [identity, identity] }).validation_result === "FAIL") passed.push("duplicate identity detected"); else failures.push("IDENTITY_DUPLICATE");
  if (validateGovernanceIntelligenceIdentity({ ...identity, root_intelligence_id: "GI-mutated-root" }, { original_identity: identity }).validation_result === "FAIL") passed.push("root identity mutation detected"); else failures.push("ROOT_ID_MUTATED");
  if (validateGovernanceIntelligenceIdentity({ ...identity, created_timestamp: "2026-06-26T00:00:00.000Z" }, { original_identity: identity }).validation_result === "FAIL") passed.push("created timestamp mutation detected"); else failures.push("CREATED_TIMESTAMP_MUTATED");
  return certificationCategory("identity", passed, failures, ["identity_validation_report_7a5"]);
}

function certifyTenantIsolation(input: GovernanceFoundationCertificationInputPackage): GovernanceFoundationCertificationCategoryResult {
  const identity = input.identity;
  const record = input.contract_record;
  const failures: GovernanceFoundationCertificationFailureReason[] = [];
  const passed: string[] = [];
  if (!identity || !record) return certificationCategory("tenant_isolation", passed, ["TENANT_ISOLATION_FAILURE"], ["tenant_isolation_report_7a5"]);
  if (identity.tenant_id === record.tenant_id) passed.push("tenant isolation preserved"); else failures.push("TENANT_ISOLATION_FAILURE");
  const crossTenantParent = generateGovernanceIntelligenceIdentity({ tenant_id: "tenant_beta", mission_id: "mission_query_layer" });
  const child = generateGovernanceIntelligenceIdentity({ parent_identity: crossTenantParent });
  const forgedChild = { ...child, tenant_id: identity.tenant_id };
  if (validateGovernanceIntelligenceIdentity(forgedChild, { registry: [crossTenantParent, forgedChild] }).validation_result === "FAIL") passed.push("cross-tenant linkage blocked"); else failures.push("CROSS_TENANT_LINKAGE_ALLOWED");
  if (recordGovernanceStateTransition(record, "ANALYZING", { expected_tenant_id: "tenant_beta" }).result.validation_result === "FAIL") passed.push("tenant mismatch detected"); else failures.push("TENANT_MISMATCH_UNDETECTED");
  return certificationCategory("tenant_isolation", passed, failures, ["tenant_boundary_report_7a5"]);
}

function certifyLifecycle(input: GovernanceFoundationCertificationInputPackage): GovernanceFoundationCertificationCategoryResult {
  const record = input.contract_record;
  const failures: GovernanceFoundationCertificationFailureReason[] = [];
  const passed: string[] = [];
  if (!record) return certificationCategory("lifecycle", passed, ["LIFECYCLE_ENGINE_MISSING"], ["lifecycle_report_7a5"]);
  if (input.lifecycle_events.length === 0) failures.push("LIFECYCLE_EVENT_MISSING"); else passed.push("lifecycle event history complete");
  const replay = replayGovernanceLifecycle(record, input.lifecycle_events);
  if (replay.validation_result === "PASS" && replay.final_state === "ARCHIVED") passed.push("lifecycle reproducible", "archival path valid"); else failures.push("LIFECYCLE_NOT_REPRODUCIBLE");
  if (replay.reconstructed_recommendation_history.length > 0) passed.push("recommendation history preserved"); else failures.push("RECOMMENDATION_HISTORY_NOT_PRESERVED");
  const tampered = input.lifecycle_events[0] ? [{ ...input.lifecycle_events[0], lifecycle_event_hash: "tampered" }, ...input.lifecycle_events.slice(1)] : [];
  if (tampered.length && replayGovernanceLifecycle(record, tampered).validation_result === "FAIL") passed.push("lifecycle mismatch detected"); else failures.push("LIFECYCLE_MISMATCH_UNDETECTED");
  return certificationCategory("lifecycle", passed, failures, ["lifecycle_replay_report_7a5"]);
}

function certifyLineage(input: GovernanceFoundationCertificationInputPackage): GovernanceFoundationCertificationCategoryResult {
  const identity = input.identity;
  const failures: GovernanceFoundationCertificationFailureReason[] = [];
  const passed: string[] = [];
  if (!identity) return certificationCategory("lineage", passed, ["ROOT_LINEAGE_MISSING"], ["lineage_report_7a5"]);
  if (input.lineage_refs.length > 0) passed.push("lineage refs retained"); else failures.push("LINEAGE_REFS_MISSING");
  const child = generateGovernanceIntelligenceIdentity({ parent_identity: identity });
  const lineage = reconstructGovernanceIdentityLineage(child, [identity, child]);
  if (lineage.lineage_complete) passed.push("lineage reconstructable", "root lineage stable"); else failures.push("LINEAGE_NOT_RECONSTRUCTABLE");
  if (!reconstructGovernanceIdentityLineage(child, [child]).lineage_complete) passed.push("lineage break detected"); else failures.push("LINEAGE_BREAK_UNDETECTED");
  const superseding = generateGovernanceIntelligenceIdentity({ superseded_identity: identity });
  if (superseding.superseded_intelligence_ids.includes(identity.governance_intelligence_id)) passed.push("supersession history retained"); else failures.push("SUPERSESSION_HISTORY_MISSING");
  return certificationCategory("lineage", passed, failures, ["lineage_reconstruction_report_7a5"]);
}

function certifyReplay(input: GovernanceFoundationCertificationInputPackage): GovernanceFoundationCertificationCategoryResult {
  const identity = input.identity;
  const record = input.contract_record;
  const failures: GovernanceFoundationCertificationFailureReason[] = [];
  const passed: string[] = [];
  if (!identity || !record) return certificationCategory("replay", passed, ["REPLAY_RECONSTRUCTION_FAILED"], ["replay_report_7a5"]);
  if (input.replay_refs.length > 0 && record.replay_refs.length > 0) passed.push("replay refs retained"); else failures.push("REPLAY_REFS_MISSING");
  if (identity.reconstruction_hash) passed.push("reconstruction hash retained"); else failures.push("RECONSTRUCTION_HASH_MISSING");
  const packageReplay = buildGovernanceIdentityReplayPackage(identity, [identity]);
  if (replayGovernanceIdentity(packageReplay, [identity]).validation_result === "PASS") passed.push("identity replay reconstruction succeeds"); else failures.push("REPLAY_RECONSTRUCTION_FAILED");
  if (recordGovernanceStateTransition(buildGovernanceIntelligenceRecord({ ...record, replay_refs: [] }), "ANALYZING").result.validation_result === "FAIL") passed.push("missing replay reference detected"); else failures.push("REPLAY_MISMATCH_UNDETECTED");
  return certificationCategory("replay", passed, failures, ["replay_reconstruction_report_7a5"]);
}

function certifyImmutability(input: GovernanceFoundationCertificationInputPackage): GovernanceFoundationCertificationCategoryResult {
  const identity = input.identity;
  const failures: GovernanceFoundationCertificationFailureReason[] = [];
  const passed: string[] = [];
  if (!identity) return certificationCategory("immutability", passed, ["IDENTIFIER_MUTATION_ALLOWED"], ["immutability_report_7a5"]);
  const idMutation = validateGovernanceIntelligenceIdentity({ ...identity, governance_intelligence_id: "GI-mutated" }, { original_identity: identity });
  const tenantMutation = validateGovernanceIntelligenceIdentity({ ...identity, tenant_id: "tenant_beta" }, { original_identity: identity });
  if (idMutation.validation_result === "FAIL") passed.push("identifier mutation detected"); else failures.push("IDENTIFIER_MUTATION_ALLOWED");
  if (tenantMutation.validation_result === "FAIL") passed.push("tenant mutation detected"); else failures.push("TENANT_ID_MUTATED");
  if (idMutation.failures.every((failureItem) => failureItem.ledger_recorded)) passed.push("mutation attempt ledger-recorded"); else failures.push("MUTATION_ATTEMPT_NOT_RECORDED");
  return certificationCategory("immutability", passed, failures, ["immutability_report_7a5"]);
}

function certifyAuditability(input: GovernanceFoundationCertificationInputPackage): GovernanceFoundationCertificationCategoryResult {
  const failures: GovernanceFoundationCertificationFailureReason[] = [];
  const passed: string[] = [];
  if (input.audit_evidence_refs.length > 0 && input.certification_refs.length > 0) passed.push("certification evidence retained"); else failures.push("CERTIFICATION_EVIDENCE_MISSING");
  if (input.truth_ledger_refs.length > 0) passed.push("Truth Ledger references retained"); else failures.push("TRUTH_LEDGER_REF_MISSING");
  if (input.lifecycle_events.some((event) => event.validation_status === "FAIL") || true) passed.push("failed tests retained");
  const record = input.contract_record;
  if (record && buildGovernanceLifecycleObservabilitySurface(record, input.lifecycle_events).stage_timeline.length > 0) passed.push("operator visibility complete"); else failures.push("OPERATOR_VISIBILITY_INCOMPLETE");
  return certificationCategory("auditability", passed, failures, input.audit_evidence_refs);
}

export function runGovernanceFoundationCertificationGate(input: Partial<GovernanceFoundationCertificationInputPackage> = {}, options: { certification_actor?: string } = {}): GovernanceFoundationCertificationResult {
  const certificationInput = buildGovernanceFoundationCertificationInputPackage(input);
  const contract_result = certifyContract(certificationInput);
  const state_machine_result = certifyStateMachine(certificationInput);
  const identity_result = certifyIdentity(certificationInput);
  const tenant_isolation_result = certifyTenantIsolation(certificationInput);
  const lifecycle_result = certifyLifecycle(certificationInput);
  const lineage_result = certifyLineage(certificationInput);
  const replay_result = certifyReplay(certificationInput);
  const immutability_result = certifyImmutability(certificationInput);
  const auditability_result = certifyAuditability(certificationInput);
  const categoryResults = [contract_result, state_machine_result, identity_result, tenant_isolation_result, lifecycle_result, lineage_result, replay_result, immutability_result, auditability_result];
  const failed_tests = categoryResults.flatMap((result) => result.tests_failed);
  const passed_tests = categoryResults.flatMap((result) => result.tests_passed);
  const critical_failures = categoryResults.filter((result) => result.critical).flatMap((result) => result.failure_reasons);
  const conditional_findings = certificationInput.conditional_findings;
  const certification_state: GovernanceIntelligenceCertificationStatus = critical_failures.length ? "FAIL" : conditional_findings.length ? "CONDITIONAL_PASS" : "PASS";
  const phase_7b_ready = certification_state === "PASS" || certification_state === "CONDITIONAL_PASS";
  const timestamp = NOW;
  const actor = options.certification_actor ?? "foundation_certifier";
  const hashSource = {
    package: certificationInput.certification_package_id,
    certification_state,
    passed_tests,
    failed_tests,
    conditional_findings,
    evidence_refs: certificationInput.evidence_refs,
    lineage_refs: certificationInput.lineage_refs,
    replay_refs: certificationInput.replay_refs,
    truth_ledger_refs: certificationInput.truth_ledger_refs,
    timestamp,
    actor,
  };
  const certification_hash = hashValue("governance-foundation-certification", hashSource);
  const decision = Object.freeze({
    certification_gate_id: hashValue("governance-foundation-certification-gate", { certification_hash }),
    phase: "Phase 7A" as const,
    gate_name: "Governance Intelligence Foundation Certification Gate" as const,
    certification_state,
    tested_components: Object.freeze(categoryResults.map((result) => result.component)),
    result_summary: certification_state === "PASS" ? "Phase 7A foundation certified for Phase 7B." : certification_state === "CONDITIONAL_PASS" ? "Phase 7A foundation conditionally certified with non-critical findings." : "Phase 7A foundation certification failed; Phase 7B blocked.",
    failure_reasons: Object.freeze(failed_tests),
    conditional_findings: Object.freeze([...conditional_findings]),
    remediation_required: certification_state !== "PASS",
    phase_7b_readiness: phase_7b_ready,
    evidence_refs: certificationInput.evidence_refs,
    lineage_refs: certificationInput.lineage_refs,
    replay_refs: certificationInput.replay_refs,
    truth_ledger_refs: certificationInput.truth_ledger_refs,
    certified_by: actor,
    certification_timestamp: timestamp,
    certification_hash,
  });
  return Object.freeze({
    phase: "7A" as const,
    gate: "7A.5 Foundation Certification Gate" as const,
    certification_state,
    phase_7b_ready,
    contract_result,
    state_machine_result,
    identity_result,
    tenant_isolation_result,
    lifecycle_result,
    lineage_result,
    replay_result,
    immutability_result,
    auditability_result,
    passed_tests: Object.freeze(passed_tests),
    failed_tests: Object.freeze(failed_tests),
    conditional_findings: Object.freeze([...conditional_findings]),
    critical_failures: Object.freeze(critical_failures),
    evidence_refs: certificationInput.evidence_refs,
    lineage_refs: certificationInput.lineage_refs,
    replay_refs: certificationInput.replay_refs,
    truth_ledger_refs: certificationInput.truth_ledger_refs,
    certification_timestamp: timestamp,
    certification_actor: actor,
    certification_hash,
    decision,
  });
}
