import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runPlatformBootstrapAuthority, validatePlatformBootstrapAuthority } from "@/services/platform-bootstrap-authority";
import type { IdentityCoreBundle, IdentityCoreDecision, IdentityCoreFailure, IdentityCoreInput, IdentityCoreResult, IdentityCoreScenario, IdentityCoreValidation, IdentityLifecycleState } from "@/types/identity-core";

const VERSION = "identity-core/w1.1a" as const;
const IDENTIFIER = "IdentityCore" as const;
const STATES = Object.freeze<IdentityLifecycleState[]>(["CREATED", "REGISTERED", "VERIFIED", "ACTIVE", "SUSPENDED", "RESTORED", "RETIRED"]);
let bootstrapBaseline: ReturnType<typeof runPlatformBootstrapAuthority> | undefined;

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function has(failures: readonly IdentityCoreFailure[], failure: IdentityCoreFailure): boolean { return failures.includes(failure); }
function verifyHashed(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function scenarioFailure(scenario: IdentityCoreScenario): IdentityCoreFailure | undefined { return scenario === "BASELINE" || scenario === "ACTIVE_WITH_OBSERVATIONS" || scenario === "CONDITIONAL_FOLLOWUP" ? undefined : scenario; }
function decisionFor(failures: readonly IdentityCoreFailure[], scenario: IdentityCoreScenario): IdentityCoreDecision {
  if (has(failures, "W1_0_BOOTSTRAP_INVALID") || has(failures, "AUTHORITY_TRANSFER_FAILED") || has(failures, "SIGNING_AUTHORITY_TRANSFER_FAILED") || has(failures, "INVALID_CREDENTIALS_ACCEPTED") || has(failures, "UNAUTHORIZED_REQUEST_ALLOWED") || has(failures, "TOKEN_SIGNING_FAILED") || has(failures, "TOKEN_SIGNATURE_NON_DETERMINISTIC") || has(failures, "IDENTITY_EVIDENCE_NOT_IMMUTABLE") || has(failures, "IDENTITY_REPLAY_FAILED")) return "FAIL_CLOSED";
  if (has(failures, "STORAGE_CORE_MISSING") || has(failures, "SECURITY_CORE_MISSING")) return "NOT_ACTIVE";
  if (failures.length || scenario === "CONDITIONAL_FOLLOWUP") return "CONDITIONALLY_ACTIVE";
  if (scenario === "ACTIVE_WITH_OBSERVATIONS") return "ACTIVE_WITH_OBSERVATIONS";
  return "CORE_ACTIVATED";
}
function resultReplayHash(result: Omit<IdentityCoreResult, "replay_hash" | "integrity_hash">): string { return hash({ foundation: result.foundation.integrity_hash, transfer: result.authority_transfer.integrity_hash, platform: result.platform_identity.integrity_hash, tenants: result.tenant_registry.integrity_hash, namespaces: result.namespace_registry.integrity_hash, authn: result.authentication_service.integrity_hash, authz: result.authorization_service.integrity_hash, tokens: result.token_service.integrity_hash, lifecycle: result.lifecycle.integrity_hash, audit: result.audit_evidence.integrity_hash, readiness: result.readiness.integrity_hash }); }
function resultIntegrityHash(result: Omit<IdentityCoreResult, "integrity_hash">): string { return hash({ version: result.phase_version, identifier: result.phase_identifier, decision: result.readiness.decision, replay_hash: result.replay_hash }); }

export function runIdentityCore(input: IdentityCoreInput = {}): IdentityCoreResult {
  const scenario = input.scenario ?? "BASELINE";
  const direct = scenarioFailure(scenario);
  const scenarioFailures = freezeArray<IdentityCoreFailure>(direct ? [direct] : []);
  bootstrapBaseline ??= runPlatformBootstrapAuthority();
  const bootstrapInvalid = !validatePlatformBootstrapAuthority(bootstrapBaseline).valid || has(scenarioFailures, "W1_0_BOOTSTRAP_INVALID");
  const failures = freezeArray([...new Set([...scenarioFailures, ...(bootstrapInvalid ? ["W1_0_BOOTSTRAP_INVALID" as const] : [])])]);
  const foundationOk = !has(failures, "PRODUCTION_IDENTITY_FOUNDATION_MISSING") && !has(failures, "PLATFORM_IDENTITY_AUTHORITY_MISSING") && !has(failures, "IDENTITY_REGISTRY_MISSING") && !has(failures, "SYSTEM_IDENTITIES_MISSING") && !has(failures, "INFRASTRUCTURE_IDENTITIES_MISSING") && !has(failures, "PRODUCTION_OWNERSHIP_INVALID") && !bootstrapInvalid;
  const transferOk = !has(failures, "AUTHORITY_TRANSFER_FAILED") && !has(failures, "BOOTSTRAP_AUTHORITY_NOT_VALIDATED") && !has(failures, "PRODUCTION_TRUST_CHAIN_MISSING") && !has(failures, "SIGNING_AUTHORITY_TRANSFER_FAILED") && !has(failures, "IDENTITY_OWNERSHIP_TRANSFER_FAILED") && !has(failures, "AUTHORITY_TRANSFER_EVIDENCE_MISSING") && !bootstrapInvalid;
  const platformOk = !has(failures, "PLATFORM_IDENTITY_MISSING") && !has(failures, "PLATFORM_CREDENTIALS_MISSING");
  const tenantOk = !has(failures, "TENANT_IDENTITY_MODEL_MISSING") && !has(failures, "TENANT_IDENTITIES_NOT_UNIQUE") && !has(failures, "TENANT_REGISTRY_MISSING");
  const namespaceOk = !has(failures, "NAMESPACE_IDENTITIES_MISSING") && !has(failures, "NAMESPACE_TENANT_BINDING_INVALID") && !has(failures, "NAMESPACE_IDENTITIES_NOT_UNIQUE") && !has(failures, "NAMESPACE_REGISTRY_MISSING");
  const authenticationOk = !has(failures, "AUTHENTICATION_SERVICE_MISSING") && !has(failures, "CREDENTIAL_VALIDATION_FAILED") && !has(failures, "CERTIFICATE_AUTHENTICATION_FAILED") && !has(failures, "TOKEN_AUTHENTICATION_FAILED") && !has(failures, "INVALID_CREDENTIALS_ACCEPTED");
  const authorizationOk = !has(failures, "AUTHORIZATION_SERVICE_MISSING") && !has(failures, "AUTHORIZATION_POLICY_MISSING") && !has(failures, "PERMISSION_BINDINGS_INVALID") && !has(failures, "AUTHORIZATION_DECISION_INVALID") && !has(failures, "UNAUTHORIZED_REQUEST_ALLOWED");
  const tokenOk = !has(failures, "IDENTITY_TOKEN_SERVICE_MISSING") && !has(failures, "TOKEN_SIGNING_FAILED") && !has(failures, "TOKEN_VALIDATION_FAILED") && !has(failures, "TOKEN_EXPIRATION_INVALID") && !has(failures, "TOKEN_SIGNATURE_NON_DETERMINISTIC");
  const lifecycleOk = !has(failures, "IDENTITY_LIFECYCLE_MISSING") && !has(failures, "LIFECYCLE_TRANSITIONS_INVALID");
  const auditOk = !has(failures, "IDENTITY_AUDIT_LEDGER_MISSING") && !has(failures, "IDENTITY_AUDIT_RECORDS_INCOMPLETE") && !has(failures, "IDENTITY_EVIDENCE_NOT_IMMUTABLE");
  const storageSecurityOk = !has(failures, "STORAGE_CORE_MISSING") && !has(failures, "SECURITY_CORE_MISSING");
  const replayOk = !has(failures, "IDENTITY_REPLAY_FAILED");
  const decision = decisionFor(failures, scenario);
  const foundation = nested({ foundation_id: foundationOk ? `foundation:w1.1a:identity:${input.seed ?? "canonical"}` : "", platform_identity_authority: foundationOk ? "authority:w1.1a:production-identity" : "", identity_registry_initialized: foundationOk, system_identities_registered: foundationOk, infrastructure_identities_registered: foundationOk, production_ownership_validated: foundationOk });
  const authority_transfer = nested({ transfer_id: transferOk ? "transfer:w1.1a:bootstrap-to-production" : "", bootstrap_authority_validated: transferOk, production_trust_chain_established: transferOk, signing_authority_transferred: transferOk, identity_ownership_transferred: transferOk, transfer_evidence_recorded: transferOk });
  const platform_identity = nested({ platform_principal_id: platformOk ? "principal:w1.1a:platform" : "", production_credentials: platformOk ? freezeArray(["credential:w1.1a:platform-signing", "credential:w1.1a:platform-authentication"]) : freezeArray<string>([]), registered: platformOk, metadata_published: platformOk });
  const tenant_registry = nested({ registry_id: tenantOk ? "registry:w1.1a:tenants" : "", tenant_identities: tenantOk ? freezeArray(["tenant:w1.1a:bootstrap", "tenant:w1.1a:platform"]) : freezeArray<string>([]), tenant_model_defined: tenantOk, identifiers_unique: tenantOk, registry_published: tenantOk });
  const namespace_registry = nested({ registry_id: namespaceOk ? "registry:w1.1a:namespaces" : "", namespace_identities: namespaceOk ? freezeArray(["namespace:civitas.platform", "namespace:civitas.identity", "namespace:civitas.audit"]) : freezeArray<string>([]), tenant_bindings_valid: namespaceOk, ownership_registered: namespaceOk, identifiers_unique: namespaceOk, registry_published: namespaceOk });
  const authentication_service = nested({ service_id: authenticationOk ? "service:w1.1a:authentication" : "", deployed: authenticationOk, credential_validation: authenticationOk, certificate_authentication: authenticationOk, token_authentication: authenticationOk, valid_identities_accepted: authenticationOk, invalid_credentials_rejected: authenticationOk });
  const authorization_service = nested({ service_id: authorizationOk ? "service:w1.1a:authorization" : "", deployed: authorizationOk, policies_configured: authorizationOk, identity_permission_bindings: authorizationOk, authorization_decisions_validated: authorizationOk, unauthorized_requests_denied: authorizationOk, evidence_recorded: authorizationOk });
  const token_service = nested({ service_id: tokenOk ? "service:w1.1a:identity-token" : "", token_signing_configured: tokenOk, token_validation_enabled: tokenOk, expiration_enforced: tokenOk, token_integrity_validated: tokenOk, signing_metadata_published: tokenOk, signed_tokens: tokenOk ? freezeArray(["token:w1.1a:platform", "token:w1.1a:tenant", "token:w1.1a:namespace"]) : freezeArray<string>([]), deterministic_signatures: tokenOk });
  const lifecycle = nested({ lifecycle_id: lifecycleOk ? "lifecycle:w1.1a:identity" : "", states: lifecycleOk ? STATES : freezeArray<IdentityLifecycleState>([]), provisioning_enabled: lifecycleOk, activation_enabled: lifecycleOk, suspension_enabled: lifecycleOk, retirement_enabled: lifecycleOk, transitions_recorded: lifecycleOk, deterministic: lifecycleOk });
  const audit_evidence = nested({ ledger_id: auditOk ? "ledger:w1.1a:identity-audit" : "", records: auditOk ? freezeArray(["audit:w1.1a:platform-identity", "audit:w1.1a:tenant-identity", "audit:w1.1a:namespace-identity", "audit:w1.1a:authority-transfer", "audit:w1.1a:authentication", "audit:w1.1a:authorization", "audit:w1.1a:token-issued"]) : freezeArray<string>([]), identity_registrations_recorded: auditOk, authority_transfers_recorded: auditOk, authentication_events_recorded: auditOk, authorization_events_recorded: auditOk, token_issuance_recorded: auditOk, sealed: auditOk, immutable: auditOk, lineage_complete: auditOk && transferOk });
  const phaseReady = decision === "CORE_ACTIVATED" || decision === "ACTIVE_WITH_OBSERVATIONS";
  const readiness = nested({ readiness_id: "W1.1A-IDENTITY-CORE-READINESS-001", decision, phase_ready: phaseReady, foundation_ready: foundationOk && storageSecurityOk, transfer_ready: transferOk, platform_identity_ready: platformOk, tenant_identity_ready: tenantOk, namespace_identity_ready: namespaceOk, authentication_ready: authenticationOk, authorization_ready: authorizationOk, token_ready: tokenOk, lifecycle_ready: lifecycleOk, audit_ready: auditOk, replay_ready: replayOk, failures });
  const base: Omit<IdentityCoreResult, "replay_hash" | "integrity_hash"> = { phase_version: VERSION, phase_identifier: IDENTIFIER, bootstrap_ref: "platform-bootstrap-authority/w1.0", foundation, authority_transfer, platform_identity, tenant_registry, namespace_registry, authentication_service, authorization_service, token_service, lifecycle, audit_evidence, readiness };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateIdentityCore(result?: IdentityCoreResult): IdentityCoreValidation {
  if (!result) return nested({ valid: false, decision: "NOT_ACTIVE" as const, replay_hash_valid: false, integrity_hash_valid: false, foundation_valid: false, transfer_valid: false, platform_identity_valid: false, tenant_registry_valid: false, namespace_registry_valid: false, authentication_valid: false, authorization_valid: false, token_valid: false, lifecycle_valid: false, audit_valid: false, readiness_valid: false, failures: freezeArray(["PRODUCTION_IDENTITY_FOUNDATION_MISSING" as const]) });
  const replay_hash_valid = resultReplayHash(result) === result.replay_hash;
  const integrity_hash_valid = resultIntegrityHash(result) === result.integrity_hash;
  const foundation_valid = verifyHashed(result.foundation) && result.foundation.platform_identity_authority.length > 0 && result.foundation.identity_registry_initialized && result.foundation.production_ownership_validated;
  const transfer_valid = verifyHashed(result.authority_transfer) && result.authority_transfer.bootstrap_authority_validated && result.authority_transfer.production_trust_chain_established && result.authority_transfer.signing_authority_transferred && result.authority_transfer.transfer_evidence_recorded;
  const platform_identity_valid = verifyHashed(result.platform_identity) && result.platform_identity.registered && result.platform_identity.production_credentials.length >= 2;
  const tenant_registry_valid = verifyHashed(result.tenant_registry) && result.tenant_registry.tenant_identities.length >= 2 && result.tenant_registry.identifiers_unique && result.tenant_registry.registry_published;
  const namespace_registry_valid = verifyHashed(result.namespace_registry) && result.namespace_registry.namespace_identities.length >= 3 && result.namespace_registry.tenant_bindings_valid && result.namespace_registry.identifiers_unique;
  const authentication_valid = verifyHashed(result.authentication_service) && result.authentication_service.deployed && result.authentication_service.valid_identities_accepted && result.authentication_service.invalid_credentials_rejected;
  const authorization_valid = verifyHashed(result.authorization_service) && result.authorization_service.deployed && result.authorization_service.authorization_decisions_validated && result.authorization_service.unauthorized_requests_denied && result.authorization_service.evidence_recorded;
  const token_valid = verifyHashed(result.token_service) && result.token_service.signed_tokens.length >= 3 && result.token_service.token_validation_enabled && result.token_service.expiration_enforced && result.token_service.deterministic_signatures;
  const lifecycle_valid = verifyHashed(result.lifecycle) && result.lifecycle.states.length === STATES.length && result.lifecycle.activation_enabled && result.lifecycle.retirement_enabled && result.lifecycle.deterministic;
  const audit_valid = verifyHashed(result.audit_evidence) && result.audit_evidence.records.length >= 7 && result.audit_evidence.sealed && result.audit_evidence.immutable && result.audit_evidence.lineage_complete;
  const readiness_valid = verifyHashed(result.readiness) && result.readiness.phase_ready && result.readiness.failures.length === 0;
  const valid = replay_hash_valid && integrity_hash_valid && foundation_valid && transfer_valid && platform_identity_valid && tenant_registry_valid && namespace_registry_valid && authentication_valid && authorization_valid && token_valid && lifecycle_valid && audit_valid && readiness_valid;
  return nested({ valid, decision: result.readiness.decision, replay_hash_valid, integrity_hash_valid, foundation_valid, transfer_valid, platform_identity_valid, tenant_registry_valid, namespace_registry_valid, authentication_valid, authorization_valid, token_valid, lifecycle_valid, audit_valid, readiness_valid, failures: result.readiness.failures });
}

export function replayIdentityCore(result = runIdentityCore()): boolean { const scenario = result.readiness.decision === "ACTIVE_WITH_OBSERVATIONS" ? { scenario: "ACTIVE_WITH_OBSERVATIONS" as const } : {}; const replayed = runIdentityCore(scenario); return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateIdentityCore(result).valid; }
export function getIdentityCoreBundle(): IdentityCoreBundle { const result = runIdentityCore(); return Object.freeze({ doctrine: Object.freeze({ version: VERSION, owns_platform_identity: true, owns_identity_authority: true, owns_tenant_identity: true, owns_namespace_identity: true, owns_authentication_services: true, owns_authorization_services: true, owns_identity_tokens: true, owns_identity_audit: true }), result, validation: validateIdentityCore(result) }); }
export const IdentityCoreService = Object.freeze({ run: runIdentityCore, validate: validateIdentityCore, replay: replayIdentityCore });
