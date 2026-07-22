import { createDecisionContext, serializeDecisionContext } from "@/services/decision-context-contract";
import { generateDecisionIntegrityHash } from "@/services/decision-integrity";
import { normalizeDecisionCandidateInput } from "@/services/decision-input-normalization";
import {
  createContextIntegrityValidationRequest,
  validateContextIntegrityExplainability,
} from "@/services/decision-context-integrity-validation-explainability";
import type { DecisionCandidate } from "@/types/decision-input-normalization";
import type { ContextIntegrityValidationReport } from "@/types/decision-context-integrity-validation-explainability";
import type {
  ContextAuditTrail,
  ContextLedgerEntry,
  ContextLedgerEventType,
  ContextRegistryFailureReason,
  ContextRegistryLifecycleState,
  ContextRegistryObservability,
  ContextRegistryPackage,
  ContextRegistryRecord,
  ContextRegistryReplayResult,
  ContextRegistryRequest,
  ContextRegistryValidationResult,
  ContextRepositoryRecord,
  ReplayPackage,
} from "@/types/decision-context-registry-ledger-replay";

const NOW = "2026-07-03T09:38:00.000Z";
const REGISTRY_VERSION = "context-registry-ledger-replay/v1" as const;
const LEDGER_EVENTS: readonly ContextLedgerEventType[] = Object.freeze([
  "CONTEXT_REGISTERED",
  "CONTEXT_VALIDATED",
  "CONTEXT_CERTIFIED",
  "CONTEXT_REPLAY_GENERATED",
  "CONTEXT_REPLAY_VERIFIED",
] as const);

function hash(value: unknown): string {
  return generateDecisionIntegrityHash(value);
}

function recordHash<T extends Record<string, unknown>>(value: T): string {
  const copy = { ...value };
  delete copy.integrity_hash;
  return hash(copy);
}

function packageHash(pkg: Omit<ContextRegistryPackage, "integrity_hash"> | ContextRegistryPackage): string {
  const copy = { ...(pkg as ContextRegistryPackage) } as Record<string, unknown>;
  delete copy.integrity_hash;
  return hash(copy);
}

function defaultCandidate(): DecisionCandidate {
  const result = normalizeDecisionCandidateInput();
  if (!result.candidate) throw new Error("default normalized candidate unavailable");
  return result.candidate;
}

export function createContextRegistryRequest(overrides: Partial<ContextRegistryRequest> = {}): ContextRegistryRequest {
  const candidate = overrides.candidate ?? defaultCandidate();
  const decision_context = overrides.decision_context ?? createDecisionContext({ candidate });
  const validation_report = overrides.validation_report ?? validateContextIntegrityExplainability(createContextIntegrityValidationRequest({ candidate, decision_context }));
  return Object.freeze({
    registration_id: overrides.registration_id ?? `context_registration_${candidate.candidate_id}`,
    candidate,
    decision_context,
    validation_report,
    existing_registry: overrides.existing_registry ?? Object.freeze([]),
    registry_version: overrides.registry_version ?? REGISTRY_VERSION,
  });
}

function tenantLeak(value: unknown, tenant_id: string): boolean {
  if (typeof value === "string") {
    const match = value.match(/tenant_(alpha|beta|[0-9]+)/i);
    return Boolean(match && match[0] !== tenant_id);
  }
  if (Array.isArray(value)) return value.some((item) => tenantLeak(item, tenant_id));
  if (value && typeof value === "object") return Object.values(value).some((item) => tenantLeak(item, tenant_id));
  return false;
}

function registryRecord(request: ContextRegistryRequest, validation: ContextIntegrityValidationReport): ContextRegistryRecord {
  const context = request.decision_context!;
  const base: Omit<ContextRegistryRecord, "integrity_hash"> = {
    registry_record_id: `registry_${context.context_id}`,
    context_id: context.context_id,
    decision_candidate_id: context.decision_candidate_id,
    tenant_id: context.identity.tenant_id,
    mission_id: context.identity.mission_id,
    context_version: context.context_version,
    schema_version: context.schema_version,
    validation_state: validation.context_validation.validation_state,
    certification_state: validation.context_validation.validation_state === "CERTIFIED" ? "CERTIFIED" : "NOT_CERTIFIED",
    registry_timestamp: NOW,
    replay_reference: `replay_registry_${context.context_id}`,
    lineage_reference: `lineage_registry_${context.context_id}`,
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function replayPackage(request: ContextRegistryRequest, validation: ContextIntegrityValidationReport): ReplayPackage {
  const context = request.decision_context!;
  const resolver_versions = Object.freeze(Object.values(validation.context_integrity.resolver_hashes).sort());
  const baseWithoutReplayHash: Omit<ReplayPackage, "replay_hash" | "integrity_hash"> = {
    replay_package_id: `replay_package_${context.context_id}`,
    context_id: context.context_id,
    replay_inputs: Object.freeze([context.context_id, context.decision_candidate_id, validation.validation_id]),
    replay_dependencies: Object.freeze([validation.replay_ref, ...validation.validation_evidence.replay_evidence].sort()),
    replay_lineage: Object.freeze([validation.context_integrity.lineage_hash, validation.context_integrity.replay_hash]),
    replay_metadata: Object.freeze({
      replay_version: "context-replay/v1",
      schema_version: context.schema_version,
      resolver_versions,
      generated_by: REGISTRY_VERSION,
    }),
    replay_version: "context-replay/v1",
  };
  const replay_hash = hash(baseWithoutReplayHash);
  const base = { ...baseWithoutReplayHash, replay_hash };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function ledgerEntries(record: ContextRegistryRecord, replay: ReplayPackage, validation: ContextIntegrityValidationReport): readonly ContextLedgerEntry[] {
  let previous = "GENESIS";
  return Object.freeze(LEDGER_EVENTS.map((event_type, index) => {
    const current_hash = hash({ event_type, context_id: record.context_id, previous, replay_hash: replay.replay_hash, index });
    const base: Omit<ContextLedgerEntry, "integrity_hash"> = {
      ledger_entry_id: `ledger_${record.context_id}_${event_type.toLowerCase()}`,
      context_id: record.context_id,
      event_type,
      event_timestamp: NOW,
      event_actor: "SYSTEM",
      event_source: REGISTRY_VERSION,
      previous_hash: previous,
      current_hash,
      replay_reference: replay.replay_package_id,
      certification_reference: validation.validation_evidence.evidence_id,
    };
    previous = current_hash;
    return Object.freeze({ ...base, integrity_hash: recordHash(base) });
  }));
}

function repositoryRecord(request: ContextRegistryRequest, validation: ContextIntegrityValidationReport, replay: ReplayPackage): ContextRepositoryRecord {
  const context = request.decision_context!;
  const base: Omit<ContextRepositoryRecord, "integrity_hash"> = {
    repository_id: `repository_${context.context_id}`,
    context_id: context.context_id,
    serialized_context: serializeDecisionContext(context),
    context_metadata: Object.freeze({
      tenant_id: context.identity.tenant_id,
      mission_id: context.identity.mission_id,
      context_version: context.context_version,
      schema_version: context.schema_version,
    }),
    validation_reports: Object.freeze([validation.validation_id, validation.context_validation.validation_id]),
    explainability_reports: Object.freeze([validation.context_explanation.explanation_id]),
    replay_package: replay,
    certification_package: Object.freeze([validation.validation_evidence.evidence_id]),
    archive_status: "ACTIVE",
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function auditTrail(record: ContextRegistryRecord, entries: readonly ContextLedgerEntry[], validation: ContextIntegrityValidationReport, replay: ReplayPackage): ContextAuditTrail {
  const base: Omit<ContextAuditTrail, "integrity_hash"> = {
    audit_id: `audit_${record.context_id}`,
    context_id: record.context_id,
    registry_events: Object.freeze([record.registry_record_id]),
    ledger_events: Object.freeze(entries.map((entry) => entry.ledger_entry_id)),
    validation_events: Object.freeze([validation.validation_id, validation.context_validation.validation_id]),
    certification_events: Object.freeze([validation.validation_evidence.evidence_id]),
    replay_events: Object.freeze([replay.replay_package_id]),
    operator_events: Object.freeze([record.decision_candidate_id]),
    governance_events: Object.freeze(validation.validation_evidence.resolver_evidence.filter((item) => item.includes("governance"))),
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function validationFor(request: ContextRegistryRequest, record: ContextRegistryRecord, entries: readonly ContextLedgerEntry[], repository: ContextRepositoryRecord, replay: ReplayPackage, audit: ContextAuditTrail): ContextRegistryValidationResult {
  const duplicate = request.existing_registry?.some((item) => item.registry_record_id === record.registry_record_id || (item.context_id === record.context_id && item.context_version === record.context_version)) ?? false;
  const validation = request.validation_report!;
  const tenantCross = tenantLeak({ record, repository, replay, audit }, request.candidate.tenant_id);
  const repositoryValid = recordHash(repository) === repository.integrity_hash;
  const replayComplete = replay.replay_inputs.length > 0 && replay.replay_dependencies.length > 0 && replay.replay_lineage.length > 0;
  const auditComplete = audit.registry_events.length > 0 && audit.ledger_events.length === entries.length && audit.validation_events.length > 0 && audit.replay_events.length > 0;
  const ledgerValid = entries.length === LEDGER_EVENTS.length && entries.every((entry, index) => entry.event_type === LEDGER_EVENTS[index] && recordHash(entry) === entry.integrity_hash);
  const integrityValid = recordHash(record) === record.integrity_hash && ledgerValid && repositoryValid && recordHash(replay) === replay.integrity_hash && recordHash(audit) === audit.integrity_hash;
  const failures: ContextRegistryFailureReason[] = [
    ...(record.registry_record_id ? [] : ["REGISTRY_WRITE_FAILED" as const]),
    ...(!ledgerValid ? ["LEDGER_APPEND_FAILED" as const] : []),
    ...(!repositoryValid ? ["REPOSITORY_PERSISTENCE_FAILED" as const] : []),
    ...(!replayComplete ? ["REPLAY_PACKAGE_INCOMPLETE" as const] : []),
    ...(request.existing_registry?.some((item) => item.context_id === record.context_id && item.context_version > record.context_version) ? ["VERSION_CONFLICT_DETECTED" as const] : []),
    ...(duplicate ? ["DUPLICATE_REGISTRY_IDENTITY" as const] : []),
    ...(!auditComplete ? ["AUDIT_TRAIL_INCOMPLETE" as const] : []),
    ...(!integrityValid ? ["INTEGRITY_VERIFICATION_FAILED" as const] : []),
    ...(tenantCross ? ["CROSS_TENANT_STORAGE_DETECTED" as const] : []),
    ...(validation.context_validation.validation_state !== "CERTIFIED" ? ["VALIDATION_NOT_CERTIFIED" as const] : []),
  ];
  const unique = Object.freeze([...new Set(failures)]);
  const lifecycle_state: ContextRegistryLifecycleState =
    unique.length ? "REGISTERED" : "CERTIFIED";
  return Object.freeze({
    validation_status: unique.length ? "FAIL" : "PASS",
    lifecycle_state,
    failure_reason: unique[0],
    failure_reasons: unique,
    checks: Object.freeze({
      registry_identity_unique: !duplicate,
      context_stored: Boolean(record.registry_record_id),
      ledger_created: ledgerValid,
      repository_integrity_verified: repositoryValid,
      replay_package_complete: replayComplete,
      replay_dependencies_resolved: replay.replay_dependencies.every((item) => !item.includes("missing")),
      version_history_preserved: !unique.includes("VERSION_CONFLICT_DETECTED"),
      audit_trail_complete: auditComplete,
      certification_artifacts_attached: validation.validation_evidence.certification_ready,
      integrity_hashes_reproducible: integrityValid,
      tenant_isolated: !tenantCross,
    }),
  });
}

export function registerContext(request: ContextRegistryRequest = createContextRegistryRequest()): ContextRegistryPackage {
  const validationReport = request.validation_report!;
  const record = registryRecord(request, validationReport);
  const replay = replayPackage(request, validationReport);
  const entries = ledgerEntries(record, replay, validationReport);
  const repository = repositoryRecord(request, validationReport, replay);
  const audit = auditTrail(record, entries, validationReport, replay);
  const validation = validationFor(request, record, entries, repository, replay, audit);
  const base: Omit<ContextRegistryPackage, "integrity_hash"> = {
    registration_id: request.registration_id,
    candidate_id: request.candidate.candidate_id,
    registry_record: record,
    ledger_entries: entries,
    repository_record: repository,
    replay_package: replay,
    audit_trail: audit,
    validation,
    replay_ref: `replay_context_registry_${request.registration_id}`,
    timestamp: NOW,
  };
  return Object.freeze({ ...base, integrity_hash: packageHash(base) });
}

export function replayContextRegistry(pkg: ContextRegistryPackage): ContextRegistryReplayResult {
  const reconstructed_hash = packageHash(pkg);
  const replay_valid = reconstructed_hash === pkg.integrity_hash;
  const base: Omit<ContextRegistryReplayResult, "integrity_hash"> = {
    replay_id: `replay_validation_${pkg.registration_id}`,
    replay_valid,
    registration_id: pkg.registration_id,
    reconstructed_hash,
    expected_hash: pkg.integrity_hash,
    reconstructed_lifecycle_state: pkg.validation.lifecycle_state,
    failures: replay_valid ? Object.freeze([]) : Object.freeze(["INTEGRITY_VERIFICATION_FAILED"] as const),
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

export function buildContextRegistryObservability(packages: readonly ContextRegistryPackage[]): ContextRegistryObservability {
  const failures = packages.flatMap((pkg) => pkg.validation.failure_reasons);
  return Object.freeze({
    registration_attempts: packages.length,
    successful_registrations: packages.filter((pkg) => pkg.validation.validation_status === "PASS").length,
    failed_registrations: packages.filter((pkg) => pkg.validation.validation_status === "FAIL").length,
    ledger_entries_created: packages.reduce((sum, pkg) => sum + pkg.ledger_entries.length, 0),
    replay_packages_created: packages.filter((pkg) => pkg.replay_package.replay_package_id).length,
    duplicate_identity_failures: failures.filter((failure) => failure === "DUPLICATE_REGISTRY_IDENTITY").length,
    persistence_failures: failures.filter((failure) => failure === "REGISTRY_WRITE_FAILED" || failure === "LEDGER_APPEND_FAILED" || failure === "REPOSITORY_PERSISTENCE_FAILED").length,
    replay_failures: failures.filter((failure) => failure === "REPLAY_PACKAGE_INCOMPLETE").length,
    integrity_failures: failures.filter((failure) => failure === "INTEGRITY_VERIFICATION_FAILED").length,
    isolation_failures: failures.filter((failure) => failure === "CROSS_TENANT_STORAGE_DETECTED").length,
    replay_success_rate: packages.length === 0 ? 0 : packages.filter((pkg) => replayContextRegistry(pkg).replay_valid).length / packages.length,
  });
}

export function getContextRegistryLedgerReplayInfrastructure() {
  const request = createContextRegistryRequest();
  const registry_package = registerContext(request);
  return Object.freeze({
    registry_version: REGISTRY_VERSION,
    ledger_events: LEDGER_EVENTS,
    request,
    registry_package,
    replay: replayContextRegistry(registry_package),
    observability: buildContextRegistryObservability([registry_package]),
  });
}
