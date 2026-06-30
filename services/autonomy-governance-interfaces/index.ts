import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { generateAutonomyIdentity } from "@/services/autonomy-identity";
import { decideConstitutionalRequest } from "@/services/autonomy-constitutional-constraints";
import type { AutonomyIdentityRecord } from "@/types/autonomy-identity";
import type {
  GovernanceInterfaceDirection,
  GovernanceInterfaceAuditLedger,
  GovernanceInterfaceDecisionState,
  GovernanceInterfaceFailureReason,
  GovernanceInterfaceMessageType,
  GovernanceInterfacePayload,
  GovernanceInterfaceReplayResult,
  GovernanceInterfacesFramework,
  GovernanceInterfaceScenario,
  GovernanceInterfaceTransaction,
  GovernanceInterfaceValidationResult,
  GovernanceInterfaceVisibilitySurface,
} from "@/types/autonomy-governance-interfaces";

const NOW = "2026-06-29T02:00:00.000Z";
const INTERFACE_VERSION = "governance-interface/v8A.6" as const;

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function uniq(values: readonly string[]): readonly string[] {
  return Object.freeze([...new Set(values.filter(Boolean))].sort());
}

function payload(summary: string, data_classification: GovernanceInterfacePayload["data_classification"], references: readonly string[]): GovernanceInterfacePayload {
  return Object.freeze({ summary, data_classification, references: freezeArray(references) });
}

function transactionHashSource(transaction: Omit<GovernanceInterfaceTransaction, "integrity_hash"> | GovernanceInterfaceTransaction) {
  return {
    transaction_id: transaction.transaction_id,
    autonomy_id: transaction.autonomy_id,
    tenant_id: transaction.tenant_id,
    mission_id: transaction.mission_id,
    direction: transaction.direction,
    source_interface: transaction.source_interface,
    destination_interface: transaction.destination_interface,
    message_type: transaction.message_type,
    message_version: transaction.message_version,
    request_payload: transaction.request_payload,
    response_payload: transaction.response_payload,
    governance_profile: transaction.governance_profile,
    authority_scope: transaction.authority_scope,
    replay_reference: transaction.replay_reference,
    lineage_reference: transaction.lineage_reference,
    truth_ledger_reference: transaction.truth_ledger_reference,
    constitutional_decision_id: transaction.constitutional_decision.constitutional_decision_id,
    hidden_route: transaction.hidden_route,
    timestamp: transaction.timestamp,
  };
}

export function computeGovernanceInterfaceHash(transaction: Omit<GovernanceInterfaceTransaction, "integrity_hash"> | GovernanceInterfaceTransaction): string {
  return hashValue("autonomy-governance-interface-transaction", transactionHashSource(transaction));
}

export function buildGovernanceInterfaceTransaction(identity = generateAutonomyIdentity(), scenario: GovernanceInterfaceScenario = "BASELINE"): GovernanceInterfaceTransaction {
  const isPublish = scenario === "PUBLISH_BASELINE" || ["UNAUTHORIZED_EXECUTION", "PRIVILEGE_ESCALATION"].includes(scenario);
  const constitutionalScenario =
    scenario === "CONSTITUTIONAL_VIOLATION" ? "CONSTITUTION_MODIFICATION" :
    scenario === "GOVERNANCE_BYPASS" ? "GOVERNANCE_BYPASS" :
    scenario === "POLICY_VIOLATION" ? "POLICY_BYPASS" :
    scenario === "CROSS_TENANT" ? "CROSS_TENANT" :
    scenario === "UNAUTHORIZED_EXECUTION" ? "UNAUTHORIZED_EXECUTION" : "BASELINE";
  const constitutional = decideConstitutionalRequest(identity, constitutionalScenario);
  const direction: GovernanceInterfaceDirection = isPublish ? "PUBLISH" : "RECEIVE";
  const message_type: GovernanceInterfaceMessageType = isPublish ? (scenario === "UNAUTHORIZED_EXECUTION" ? "EXECUTION_INTENT" : "AUTONOMY_STATE") : "GOVERNANCE_STATE";
  const base = {
    transaction_id: `GIT-${hashValue("governance-interface-transaction-id", { id: identity.primary.autonomy_id, scenario, direction }).slice(0, 12).toUpperCase()}`,
    autonomy_id: identity.primary.autonomy_id,
    tenant_id: scenario === "CROSS_TENANT" ? "tenant_beta" : identity.primary.tenant_id,
    mission_id: identity.primary.mission_id,
    direction,
    source_interface: direction === "RECEIVE" ? "GOVERNANCE_INTELLIGENCE" as const : "CONTROLLED_AUTONOMY" as const,
    destination_interface: direction === "RECEIVE" ? "CONTROLLED_AUTONOMY" as const : "GOVERNANCE_INTELLIGENCE" as const,
    message_type,
    message_version: scenario === "INVALID_SCHEMA_VERSION" ? "governance-interface/v0" as typeof INTERFACE_VERSION : INTERFACE_VERSION,
    request_payload: scenario === "MALFORMED_MESSAGE" ? payload("", "GOVERNANCE", []) : payload(`${direction.toLowerCase()} governance interface request`, isPublish ? "LIFECYCLE" : "GOVERNANCE", ["governance-intelligence:v7", "visibility:v7"]),
    response_payload: payload(`${direction.toLowerCase()} governance interface response`, isPublish ? "EVIDENCE" : "POLICY", ["truth-ledger:v7", "replay:v7"]),
    governance_profile: scenario === "GOVERNANCE_BYPASS" ? "" : identity.source_contract.governance.governance_profile,
    authority_scope: scenario === "PRIVILEGE_ESCALATION" ? "RECOVER" as const : identity.primary.authority_scope,
    replay_reference: scenario === "REPLAY_OMISSION" || scenario === "UNDOCUMENTED_COMMUNICATION" ? "" : identity.primary.replay_reference,
    lineage_reference: scenario === "MISSING_LINEAGE" || scenario === "UNDOCUMENTED_COMMUNICATION" ? "" : identity.primary.lineage_reference,
    truth_ledger_reference: scenario === "UNDOCUMENTED_COMMUNICATION" ? "" : `truth-ledger:${identity.primary.mission_id}:${identity.primary.tenant_id}`,
    constitutional_decision: constitutional.decision,
    hidden_route: scenario === "HIDDEN_TRAFFIC",
    timestamp: NOW,
  };
  return Object.freeze({ ...base, integrity_hash: scenario === "INTEGRITY_FAILURE" ? "tampered-governance-interface" : computeGovernanceInterfaceHash(base) });
}

export function validateGovernanceInterfaceTransaction(identity: AutonomyIdentityRecord, transaction: GovernanceInterfaceTransaction): GovernanceInterfaceValidationResult {
  const failures: GovernanceInterfaceFailureReason[] = [];
  if (!transaction.request_payload.summary || !transaction.response_payload.summary) failures.push("SCHEMA_INVALID");
  if (transaction.message_version !== INTERFACE_VERSION) failures.push("INVALID_SCHEMA_VERSION");
  if (transaction.tenant_id !== identity.primary.tenant_id) failures.push("TENANT_OWNERSHIP_INVALID");
  if (!transaction.governance_profile) failures.push("GOVERNANCE_UNAUTHORIZED");
  if (transaction.constitutional_decision.decision === "DENIED") failures.push("CONSTITUTIONAL_VIOLATION");
  if (transaction.constitutional_decision.denial_reason === "POLICY_BYPASS") failures.push("POLICY_INCOMPATIBLE");
  if (transaction.authority_scope === "RECOVER" && identity.primary.authority_scope !== "RECOVER") failures.push("PRIVILEGE_ESCALATION");
  if (!transaction.replay_reference) failures.push("REPLAY_REGISTRATION_MISSING");
  if (!transaction.lineage_reference) failures.push("LINEAGE_REGISTRATION_MISSING");
  if (!transaction.truth_ledger_reference) failures.push("TRUTH_LEDGER_REGISTRATION_MISSING");
  if (transaction.hidden_route) failures.push("HIDDEN_INTERFACE_TRAFFIC");
  if (!transaction.replay_reference && !transaction.lineage_reference && !transaction.truth_ledger_reference) failures.push("UNDOCUMENTED_COMMUNICATION");
  if (transaction.message_type === "EXECUTION_INTENT" && transaction.constitutional_decision.decision !== "APPROVED") failures.push("UNAUTHORIZED_EXECUTION_REQUEST");
  if (computeGovernanceInterfaceHash(transaction) !== transaction.integrity_hash) failures.push("INTEGRITY_VERIFICATION_FAILED");
  const uniqueFailures = freezeArray([...new Set(failures)]);
  const decision: GovernanceInterfaceDecisionState = uniqueFailures.length ? "REJECTED" : "ACCEPTED";
  const has = (reason: GovernanceInterfaceFailureReason) => uniqueFailures.includes(reason);
  const source = { id: transaction.transaction_id, decision, uniqueFailures };
  return Object.freeze({
    validation_id: `GIV-${hashValue("governance-interface-validation-id", source).slice(0, 12).toUpperCase()}`,
    transaction_id: transaction.transaction_id,
    validation_state: decision === "ACCEPTED" ? "PASS" : "FAIL",
    decision,
    failures: uniqueFailures,
    schema_validated: !has("SCHEMA_INVALID") && !has("INVALID_SCHEMA_VERSION") && !has("MALFORMED_INTERFACE_MESSAGE"),
    tenant_validated: !has("TENANT_OWNERSHIP_INVALID"),
    governance_authorized: !has("GOVERNANCE_UNAUTHORIZED") && !has("HIDDEN_INTERFACE_TRAFFIC"),
    constitutionally_compliant: !has("CONSTITUTIONAL_VIOLATION"),
    policy_compatible: !has("POLICY_INCOMPATIBLE"),
    authority_validated: !has("AUTHORITY_SCOPE_INVALID") && !has("PRIVILEGE_ESCALATION") && !has("UNAUTHORIZED_EXECUTION_REQUEST"),
    replay_registered: !has("REPLAY_REGISTRATION_MISSING"),
    lineage_registered: !has("LINEAGE_REGISTRATION_MISSING"),
    truth_ledger_registered: !has("TRUTH_LEDGER_REGISTRATION_MISSING"),
    integrity_verified: !has("INTEGRITY_VERIFICATION_FAILED"),
    fail_closed: decision === "REJECTED",
    validation_hash: hashValue("governance-interface-validation", source),
  });
}

export function buildGovernanceInterfaceAuditLedger(identity: AutonomyIdentityRecord, transactions: readonly GovernanceInterfaceTransaction[]): GovernanceInterfaceAuditLedger {
  const validations = transactions.map((transaction) => validateGovernanceInterfaceTransaction(identity, transaction));
  const accepted = transactions.filter((_, index) => validations[index].decision === "ACCEPTED");
  const rejected = transactions.filter((_, index) => validations[index].decision === "REJECTED");
  const source = {
    ledger_id: `GIL-${hashValue("governance-interface-ledger-id", transactions.map((item) => item.transaction_id)).slice(0, 12).toUpperCase()}`,
    autonomy_id: identity.primary.autonomy_id,
    tenant_id: identity.primary.tenant_id,
    mission_id: identity.primary.mission_id,
    transactions: freezeArray(transactions),
    accepted_transactions: freezeArray(accepted),
    rejected_transactions: freezeArray(rejected),
    replay_references: uniq(transactions.map((item) => item.replay_reference)),
    lineage_references: uniq(transactions.map((item) => item.lineage_reference)),
    truth_ledger_references: uniq(transactions.map((item) => item.truth_ledger_reference)),
  };
  return Object.freeze({ ...source, ledger_hash: hashValue("governance-interface-ledger", source) });
}

export function replayGovernanceInterfaceTransactions(identity: AutonomyIdentityRecord, ledger: GovernanceInterfaceAuditLedger): GovernanceInterfaceReplayResult {
  const failures: GovernanceInterfaceFailureReason[] = [];
  const decisions = ledger.transactions.map((transaction) => {
    const validation = validateGovernanceInterfaceTransaction(identity, transaction);
    if (validation.decision === "REJECTED") failures.push(validation.failures[0] ?? "FAIL_CLOSED");
    return validation.decision;
  });
  if (ledger.transactions.some((transaction) => computeGovernanceInterfaceHash(transaction) !== transaction.integrity_hash)) failures.push("INTEGRITY_VERIFICATION_FAILED");
  const source = {
    replay_id: `GIR-${hashValue("governance-interface-replay-id", ledger.ledger_id).slice(0, 12).toUpperCase()}`,
    autonomy_id: ledger.autonomy_id,
    transaction_ids: freezeArray(ledger.transactions.map((item) => item.transaction_id)),
    reconstructed_decisions: freezeArray(decisions),
    source_interfaces: freezeArray(ledger.transactions.map((item) => item.source_interface)),
    destination_interfaces: freezeArray(ledger.transactions.map((item) => item.destination_interface)),
    replay_references: ledger.replay_references,
    validation_state: failures.length ? "FAIL" as const : "PASS" as const,
    failure_reason: failures[0] ?? null,
  };
  return Object.freeze({ ...source, replay_hash: hashValue("governance-interface-replay", source) });
}

export function buildGovernanceInterfaceVisibilitySurface(identity: AutonomyIdentityRecord, ledger: GovernanceInterfaceAuditLedger): GovernanceInterfaceVisibilitySurface {
  const replay = replayGovernanceInterfaceTransactions(identity, ledger);
  return Object.freeze({
    autonomy_id: identity.primary.autonomy_id,
    interface_activity: ledger.transactions,
    governance_interactions: freezeArray([...new Set(ledger.transactions.flatMap((item) => [item.source_interface, item.destination_interface]))]),
    policy_exchanges: freezeArray(ledger.transactions.filter((item) => item.message_type === "POLICY_UPDATE")),
    authority_decisions: freezeArray(ledger.transactions.map((item) => item.constitutional_decision.constitutional_decision_id)),
    replay_references: ledger.replay_references,
    lineage_references: ledger.lineage_references,
    execution_intent: freezeArray(ledger.transactions.filter((item) => item.message_type === "EXECUTION_INTENT")),
    evidence_flow: uniq(ledger.transactions.flatMap((item) => [...item.request_payload.references, ...item.response_payload.references])),
    lifecycle_events: freezeArray(ledger.transactions.filter((item) => item.message_type === "LIFECYCLE_EVENT" || item.message_type === "AUTONOMY_STATE")),
    interface_health: ledger.rejected_transactions.length ? "DEGRADED" : "HEALTHY",
    integrity_status: replay.validation_state === "PASS" ? "VALID" : "INVALID",
    hidden_transactions_visible: false,
  });
}

export function getGovernanceInterfacesFramework(): GovernanceInterfacesFramework {
  const identity = generateAutonomyIdentity();
  const receive_transaction = buildGovernanceInterfaceTransaction(identity);
  const publish_transaction = buildGovernanceInterfaceTransaction(identity, "PUBLISH_BASELINE");
  const ledger = buildGovernanceInterfaceAuditLedger(identity, [receive_transaction, publish_transaction]);
  return Object.freeze({
    identity,
    receive_transaction,
    publish_transaction,
    receive_validation: validateGovernanceInterfaceTransaction(identity, receive_transaction),
    publish_validation: validateGovernanceInterfaceTransaction(identity, publish_transaction),
    ledger,
    replay: replayGovernanceInterfaceTransactions(identity, ledger),
    visibility: buildGovernanceInterfaceVisibilitySurface(identity, ledger),
  });
}
