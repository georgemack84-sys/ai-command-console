import {
  computeDecisionContractIntegrityHash,
  createDecisionContract as createFoundationContract,
  validateCompatibility,
  validateDecisionContract as validateFoundationContract,
} from "@/services/decision-contract";
import {
  createDecisionInput,
  createDecisionMetadata,
  createDecisionOrchestrationRecord,
  hashDecisionSchemaPayload,
} from "@/services/decision-schema";
import { createReplayLineageContract, reconstructDecisionHistory } from "@/services/decision-replay-lineage";
import {
  createDecisionIntegrityEvaluation,
  generateDecisionIntegrityHash,
  serializeDecisionCanonically,
  validateDecisionIntegrity as validateIntegrityEvaluation,
} from "@/services/decision-integrity";
import {
  buildDecisionValidationObservability,
  replayValidation as replayValidationReport,
  validateDecisionContract as validateValidationEngineContract,
  validateDomain,
} from "@/services/decision-validation-engine";
import type { DecisionContract } from "@/types/decision-contract";
import type {
  ApiInvocationRecord,
  ContractInspection,
  DecisionApiName,
  DecisionApiVersion,
  DecisionSdkClient,
  DecisionSdkContext,
  DecisionSdkContract,
  DecisionSdkError,
  DecisionSdkErrorClass,
  DecisionSdkObservability,
  DecisionSdkResponse,
  DecisionSdkVersion,
  IntegrityBuilderResult,
  LineageBuilderResult,
  ReplayBuilderResult,
  SdkCompatibilityResult,
  SerializedDecisionEnvelope,
} from "@/types/decision-sdk";
import type { DecisionValidationDomain, DecisionValidationInput, ValidationReport } from "@/types/decision-validation-engine";

const NOW = "2026-07-02T09:20:00.000Z";
const SDK_VERSION: DecisionSdkVersion = "1.0.0";
const API_VERSION: DecisionApiVersion = "1.0.0";
const SUPPORTED_ERROR_CLASSES: readonly DecisionSdkErrorClass[] = Object.freeze(["SCHEMA_ERROR", "VALIDATION_ERROR", "GOVERNANCE_ERROR", "CONSTITUTION_ERROR", "AUTHORITY_ERROR", "REPLAY_ERROR", "LINEAGE_ERROR", "INTEGRITY_ERROR", "SERIALIZATION_ERROR", "VERSION_ERROR", "AUTHENTICATION_ERROR", "TENANT_ERROR", "UNKNOWN_ERROR"] as const);

function sdkError(error_class: DecisionSdkErrorClass, message: string): DecisionSdkError {
  return Object.freeze({ error_class, message, fail_closed: true });
}

function versionSupported(version: string | undefined): boolean {
  return version === undefined || version === API_VERSION;
}

function contextError(context: Partial<DecisionSdkContext> | DecisionSdkContext): DecisionSdkError | null {
  if (!context.authenticated_identity) return sdkError("AUTHENTICATION_ERROR", "authenticated identity is required for every SDK operation.");
  if (!context.tenant_id || !context.mission_id) return sdkError("TENANT_ERROR", "tenant and mission context are required for every SDK operation.");
  if (!context.authority_ref) return sdkError("AUTHORITY_ERROR", "authority verification reference is required for every SDK operation.");
  if (!versionSupported(context.api_version)) return sdkError("VERSION_ERROR", "unsupported SDK API version.");
  return null;
}

function invocation(input: {
  context: DecisionSdkContext;
  api_name: DecisionApiName;
  contract_version?: string;
  validation_status: "PASS" | "FAIL";
}): ApiInvocationRecord {
  const base: Omit<ApiInvocationRecord, "integrity_hash"> = {
    invocation_id: `api_${input.context.tenant_id}_${input.context.mission_id}_${input.api_name}`,
    tenant_id: input.context.tenant_id,
    mission_id: input.context.mission_id,
    api_name: input.api_name,
    sdk_version: input.context.sdk_version ?? SDK_VERSION,
    contract_version: input.contract_version ?? "1.0.0",
    replay_reference: `replay_api_${input.context.tenant_id}_${input.context.mission_id}_${input.api_name}`,
    validation_status: input.validation_status,
    invoked_at: NOW,
  };
  return Object.freeze({ ...base, integrity_hash: generateDecisionIntegrityHash(base) });
}

function response<T>(context: DecisionSdkContext, api_name: DecisionApiName, data: T, contract_version = "1.0.0"): DecisionSdkResponse<T> {
  return Object.freeze({ ok: true, api_name, data, invocation: invocation({ context, api_name, contract_version, validation_status: "PASS" }) });
}

function failed<T>(context: DecisionSdkContext, api_name: DecisionApiName, error: DecisionSdkError, contract_version = "1.0.0"): DecisionSdkResponse<T> {
  return Object.freeze({ ok: false, api_name, error, invocation: invocation({ context, api_name, contract_version, validation_status: "FAIL" }) });
}

function guarded<T>(context: DecisionSdkContext, api_name: DecisionApiName, action: () => T, contract_version = "1.0.0"): DecisionSdkResponse<T> {
  const error = contextError(context);
  if (error) return failed(context, api_name, error, contract_version);
  try {
    return response(context, api_name, action(), contract_version);
  } catch {
    return failed(context, api_name, sdkError("UNKNOWN_ERROR", "SDK operation failed closed."), contract_version);
  }
}

function asSdkError(reason: string): DecisionSdkError {
  if (reason.includes("VERSION") || reason.includes("UNSUPPORTED")) return sdkError("VERSION_ERROR", reason);
  if (reason.includes("TENANT")) return sdkError("TENANT_ERROR", reason);
  if (reason.includes("GOVERNANCE") || reason.includes("POLICY")) return sdkError("GOVERNANCE_ERROR", reason);
  if (reason.includes("CONSTITUTION")) return sdkError("CONSTITUTION_ERROR", reason);
  if (reason.includes("AUTHORITY") || reason.includes("APPROVAL") || reason.includes("EXECUTION")) return sdkError("AUTHORITY_ERROR", reason);
  if (reason.includes("REPLAY")) return sdkError("REPLAY_ERROR", reason);
  if (reason.includes("LINEAGE")) return sdkError("LINEAGE_ERROR", reason);
  if (reason.includes("HASH") || reason.includes("INTEGRITY") || reason.includes("MUTATION")) return sdkError("INTEGRITY_ERROR", reason);
  if (reason.includes("SERIALIZATION") || reason.includes("DETERMINISTIC")) return sdkError("SERIALIZATION_ERROR", reason);
  if (reason.includes("SCHEMA") || reason.includes("FIELD") || reason.includes("ENUM")) return sdkError("SCHEMA_ERROR", reason);
  return sdkError("UNKNOWN_ERROR", reason);
}

export function getDecisionSdkContract(): DecisionSdkContract {
  return Object.freeze({
    sdk_version: SDK_VERSION,
    api_version: API_VERSION,
    supported_error_classes: SUPPORTED_ERROR_CLASSES,
    compatible_validation_error_classes: Object.freeze(["SCHEMA_ERROR", "LIFECYCLE_ERROR", "GOVERNANCE_ERROR", "CONSTITUTION_ERROR", "AUTHORITY_ERROR", "REPLAY_ERROR", "LINEAGE_ERROR", "INTEGRITY_ERROR", "SERIALIZATION_ERROR", "VERSION_ERROR", "TENANT_ERROR", "UNKNOWN_ERROR"] as const),
  });
}

export function createSdkContext(overrides: Partial<DecisionSdkContext> = {}): DecisionSdkContext {
  return Object.freeze({
    tenant_id: overrides.tenant_id ?? "tenant_alpha",
    mission_id: overrides.mission_id ?? "mission_phase_9_decision_orchestration",
    authenticated_identity: overrides.authenticated_identity ?? "developer:mission-control-sdk",
    authority_ref: overrides.authority_ref ?? "authority_tenant_alpha_operator_review_required_v1",
    api_version: overrides.api_version ?? API_VERSION,
    sdk_version: overrides.sdk_version ?? SDK_VERSION,
  });
}

export function createDecisionSdk(context: Partial<DecisionSdkContext> = {}): DecisionSdkClient {
  const sdkContext = createSdkContext(context);
  const records: ApiInvocationRecord[] = [];
  const track = <T>(apiResponse: DecisionSdkResponse<T>): DecisionSdkResponse<T> => {
    records.push(apiResponse.invocation);
    return apiResponse;
  };
  return Object.freeze({
    context: sdkContext,
    contract: getDecisionSdkContract(),
    builders: Object.freeze({
      DecisionBuilder: () => DecisionBuilder(sdkContext),
      MetadataBuilder: () => MetadataBuilder(sdkContext),
      ReplayBuilder: () => ReplayBuilder(sdkContext),
      LineageBuilder: () => LineageBuilder(sdkContext),
      IntegrityBuilder: () => IntegrityBuilder(sdkContext),
    }),
    invocations: () => Object.freeze([...records]),
    validateDecisionContract: (input?: DecisionValidationInput) => track(validateDecisionContract(sdkContext, input)) as never,
  } as DecisionSdkClient & { validateDecisionContract: (input?: DecisionValidationInput) => DecisionSdkResponse<ValidationReport> });
}

export function validateDecisionContract(context: DecisionSdkContext = createSdkContext(), input: DecisionValidationInput = {}): DecisionSdkResponse<ValidationReport> {
  return guarded(context, "validateDecisionContract", () => validateValidationEngineContract(input));
}

function validateDomainApi(context: DecisionSdkContext, api_name: DecisionApiName, domain: DecisionValidationDomain, input: DecisionValidationInput = {}) {
  return guarded(context, api_name, () => validateDomain(domain, input));
}

export function validateSchema(context: DecisionSdkContext = createSdkContext(), input: DecisionValidationInput = {}) {
  return validateDomainApi(context, "validateSchema", "SCHEMA", input);
}

export function validateLifecycle(context: DecisionSdkContext = createSdkContext(), input: DecisionValidationInput = {}) {
  return validateDomainApi(context, "validateLifecycle", "LIFECYCLE", input);
}

export function validateGovernance(context: DecisionSdkContext = createSdkContext(), input: DecisionValidationInput = {}) {
  return validateDomainApi(context, "validateGovernance", "GOVERNANCE", input);
}

export function validateConstitution(context: DecisionSdkContext = createSdkContext(), input: DecisionValidationInput = {}) {
  return validateDomainApi(context, "validateConstitution", "CONSTITUTION", input);
}

export function validateAuthority(context: DecisionSdkContext = createSdkContext(), input: DecisionValidationInput = {}) {
  return validateDomainApi(context, "validateAuthority", "AUTHORITY", input);
}

export function validateReplay(context: DecisionSdkContext = createSdkContext(), input: DecisionValidationInput = {}) {
  return validateDomainApi(context, "validateReplay", "REPLAY", input);
}

export function validateLineage(context: DecisionSdkContext = createSdkContext(), input: DecisionValidationInput = {}) {
  return validateDomainApi(context, "validateLineage", "LINEAGE", input);
}

export function validateIntegrity(context: DecisionSdkContext = createSdkContext(), input: DecisionValidationInput = {}) {
  return validateDomainApi(context, "validateIntegrity", "INTEGRITY", input);
}

export function createDecisionContract(context: DecisionSdkContext = createSdkContext(), overrides: Partial<DecisionContract> = {}): DecisionSdkResponse<DecisionContract> {
  return guarded(context, "createDecisionContract", () => createFoundationContract({
    tenant_id: context.tenant_id,
    mission_id: context.mission_id,
    ...overrides,
  }));
}

export function loadDecisionContract(context: DecisionSdkContext = createSdkContext(), payload: string | DecisionContract): DecisionSdkResponse<DecisionContract> {
  return guarded(context, "loadDecisionContract", () => {
    const contract = typeof payload === "string" ? deserializeDecisionPayload(payload) : payload;
    const validation = validateFoundationContract(contract);
    if (validation.validation_state !== "VALID") throw new Error(validation.errors[0]?.reason ?? "VALIDATION_ERROR");
    return contract;
  });
}

export function upgradeContractVersion(context: DecisionSdkContext = createSdkContext(), contract: DecisionContract, target_version: "1.0.0" = "1.0.0"): DecisionSdkResponse<DecisionContract> {
  return guarded(context, "upgradeContractVersion", () => Object.freeze({
    ...contract,
    contract_version: target_version,
    compatibility_version: target_version,
    integrity_hash: computeDecisionContractIntegrityHash({ ...contract, contract_version: target_version, compatibility_version: target_version }),
  }));
}

export function validateContractCompatibility(context: DecisionSdkContext = createSdkContext(), producer_version = "1.0.0", consumer_version = "1.0.0"): DecisionSdkResponse<SdkCompatibilityResult> {
  return guarded(context, "validateContractCompatibility", () => {
    const validation = validateCompatibility(producer_version as "1.0.0", consumer_version as "1.0.0");
    return Object.freeze({
      compatible: validation.compatibility_state === "COMPATIBLE",
      producer_version,
      consumer_version,
      errors: Object.freeze(validation.errors.map((error) => asSdkError(error.reason))),
    });
  });
}

export function inspectDecisionContract(context: DecisionSdkContext = createSdkContext(), contract = createFoundationContract()): DecisionSdkResponse<ContractInspection> {
  return guarded(context, "inspectDecisionContract", () => Object.freeze({
    orchestration_id: contract.orchestration_id,
    tenant_id: contract.tenant_id,
    mission_id: contract.mission_id,
    contract_version: contract.contract_version,
    compatibility_version: contract.compatibility_version,
    integrity_algorithm: contract.integrity_algorithm,
    advisory_only: contract.authority_boundary.advisory_only,
    governance_required: contract.validation_rules.governance_required,
    constitutional_required: contract.validation_rules.constitutional_required,
    replay_required: contract.validation_rules.replay_required,
    integrity_required: contract.validation_rules.integrity_required,
  }), contract.contract_version);
}

export function DecisionBuilder(context: DecisionSdkContext = createSdkContext()) {
  const input = createDecisionInput({ tenant_id: context.tenant_id, mission_id: context.mission_id });
  return Object.freeze({ input, record: createDecisionOrchestrationRecord({ input }) });
}

export function MetadataBuilder(context: DecisionSdkContext = createSdkContext()) {
  return createDecisionMetadata({ tenant_scope: context.tenant_id, mission_scope: context.mission_id, created_by: context.authenticated_identity });
}

export function ReplayBuilder(context: DecisionSdkContext = createSdkContext()): ReplayBuilderResult {
  void context;
  const replay_contract = createReplayLineageContract();
  return Object.freeze({ replay_contract, replay_reference_ids: Object.freeze(replay_contract.replay_references.map((ref) => ref.replay_reference_id).sort()) });
}

export function LineageBuilder(context: DecisionSdkContext = createSdkContext()): LineageBuilderResult {
  void context;
  const replay_contract = createReplayLineageContract();
  return Object.freeze({
    replay_contract,
    lineage_id: replay_contract.lineage.lineage_id,
    parent_decision_id: replay_contract.lineage.parent_decision_id,
    child_decision_ids: replay_contract.lineage.child_decision_ids,
  });
}

export function IntegrityBuilder(context: DecisionSdkContext = createSdkContext()): IntegrityBuilderResult {
  void context;
  const integrity_evaluation = createDecisionIntegrityEvaluation();
  return Object.freeze({ integrity_evaluation, integrity_hash: integrity_evaluation.integrity_hash });
}

export function serializeDecision(context: DecisionSdkContext = createSdkContext(), decision: unknown): DecisionSdkResponse<SerializedDecisionEnvelope> {
  return guarded(context, "serializeDecision", () => {
    const payload = serializeDecisionCanonically(decision);
    return Object.freeze({
      serialization_version: "decision-sdk-canonical-json/v1",
      api_version: context.api_version ?? API_VERSION,
      payload_type: "decision",
      payload,
      integrity_hash: generateDecisionIntegrityHash(payload),
    });
  });
}

function deserializeDecisionPayload(payload: string): DecisionContract {
  const parsed = JSON.parse(payload) as DecisionContract | SerializedDecisionEnvelope;
  if ("payload" in parsed && parsed.serialization_version === "decision-sdk-canonical-json/v1") {
    return JSON.parse(parsed.payload) as DecisionContract;
  }
  return parsed as DecisionContract;
}

export function deserializeDecision(context: DecisionSdkContext = createSdkContext(), payload: string): DecisionSdkResponse<DecisionContract> {
  return guarded(context, "deserializeDecision", () => deserializeDecisionPayload(payload));
}

export function serializeReplayArtifacts(context: DecisionSdkContext = createSdkContext(), replay = createReplayLineageContract()): DecisionSdkResponse<SerializedDecisionEnvelope> {
  return guarded(context, "serializeReplayArtifacts", () => {
    const payload = serializeDecisionCanonically(replay);
    return Object.freeze({
      serialization_version: "decision-sdk-canonical-json/v1",
      api_version: context.api_version ?? API_VERSION,
      payload_type: "decision",
      payload,
      integrity_hash: generateDecisionIntegrityHash(payload),
    });
  });
}

export function prepareIntegrityHash(context: DecisionSdkContext = createSdkContext(), payload: unknown): DecisionSdkResponse<string> {
  return guarded(context, "prepareIntegrityHash", () => generateDecisionIntegrityHash(payload));
}

export function replayValidation(context: DecisionSdkContext = createSdkContext(), report = validateValidationEngineContract()): DecisionSdkResponse<ReturnType<typeof replayValidationReport>> {
  return guarded(context, "replayValidation", () => replayValidationReport(report));
}

export function replayDecisionHistory(context: DecisionSdkContext = createSdkContext(), replay = createReplayLineageContract()) {
  return Object.freeze({ context, reconstruction: reconstructDecisionHistory(replay) });
}

export function validateSdkIntegrity(context: DecisionSdkContext = createSdkContext(), integrity = createDecisionIntegrityEvaluation()) {
  void context;
  return validateIntegrityEvaluation(integrity);
}

export function buildDecisionSdkObservability(responses: readonly DecisionSdkResponse<unknown>[]): DecisionSdkObservability {
  const invocations = responses.map((item) => item.invocation);
  const errors = responses.map((item) => item.error).filter((item): item is DecisionSdkError => Boolean(item));
  const reports = responses.flatMap((item) => item.data && typeof item.data === "object" && "validation_result" in item.data ? [item.data as ValidationReport] : []);
  const compatibilityFailures = responses.filter((item) => item.data && typeof item.data === "object" && "compatible" in item.data && item.data.compatible === false).length;
  return Object.freeze({
    api_invocation_count: responses.length,
    sdk_version_adoption: Object.freeze(invocations.reduce<Record<string, number>>((counts, record) => {
      counts[record.sdk_version] = (counts[record.sdk_version] ?? 0) + 1;
      return counts;
    }, {})),
    api_latency_ms: 0,
    validation_latency_ms: buildDecisionValidationObservability(reports).validation_duration_ms,
    serialization_latency_ms: 0,
    replay_success_rate: invocations.length === 0 ? 0 : invocations.filter((record) => record.validation_status === "PASS").length / invocations.length,
    compatibility_failures: compatibilityFailures + errors.filter((error) => error.error_class === "VERSION_ERROR").length,
    authentication_failures: errors.filter((error) => error.error_class === "AUTHENTICATION_ERROR").length,
    error_classifications: Object.freeze(SUPPORTED_ERROR_CLASSES.reduce<Record<DecisionSdkErrorClass, number>>((counts, errorClass) => {
      counts[errorClass] = errors.filter((error) => error.error_class === errorClass).length;
      return counts;
    }, {} as Record<DecisionSdkErrorClass, number>)),
    integration_success_rate: responses.length === 0 ? 0 : responses.filter((item) => item.ok).length / responses.length,
  });
}

export function getDecisionSdkSample() {
  const context = createSdkContext();
  const contract = createDecisionContract(context);
  const validation = validateDecisionContract(context);
  const serialized = serializeDecision(context, contract.data);
  const replay = validation.data ? replayValidation(context, validation.data) : replayValidation(context);
  const integrity = contract.data ? prepareIntegrityHash(context, contract.data) : prepareIntegrityHash(context, {});
  return Object.freeze({
    context,
    contract,
    validation,
    serialized,
    replay,
    integrity,
    observability: buildDecisionSdkObservability([contract, validation, serialized, replay, integrity]),
  });
}

export function hashDecisionSdkPayload(payload: unknown): string {
  return hashDecisionSchemaPayload(payload);
}
