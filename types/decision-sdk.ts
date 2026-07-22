import type { DecisionIntegrityEvaluation } from "@/types/decision-integrity";
import type { DecisionValidationErrorClass } from "@/types/decision-validation-engine";
import type { DecisionReplayLineageContract } from "@/types/decision-replay-lineage";
import type { DecisionInput, DecisionMetadata, DecisionOrchestrationRecord } from "@/types/decision-schema";

export type DecisionSdkVersion = "1.0.0";
export type DecisionApiVersion = "1.0.0";

export type DecisionSdkErrorClass =
  | "SCHEMA_ERROR"
  | "VALIDATION_ERROR"
  | "GOVERNANCE_ERROR"
  | "CONSTITUTION_ERROR"
  | "AUTHORITY_ERROR"
  | "REPLAY_ERROR"
  | "LINEAGE_ERROR"
  | "INTEGRITY_ERROR"
  | "SERIALIZATION_ERROR"
  | "VERSION_ERROR"
  | "AUTHENTICATION_ERROR"
  | "TENANT_ERROR"
  | "UNKNOWN_ERROR";

export type DecisionApiName =
  | "validateDecisionContract"
  | "validateSchema"
  | "validateLifecycle"
  | "validateGovernance"
  | "validateConstitution"
  | "validateAuthority"
  | "validateReplay"
  | "validateLineage"
  | "validateIntegrity"
  | "createDecisionContract"
  | "loadDecisionContract"
  | "upgradeContractVersion"
  | "validateContractCompatibility"
  | "inspectDecisionContract"
  | "serializeDecision"
  | "deserializeDecision"
  | "serializeReplayArtifacts"
  | "prepareIntegrityHash"
  | "replayValidation";

export type DecisionSdkContext = Readonly<{
  tenant_id: string;
  mission_id: string;
  authenticated_identity: string;
  authority_ref: string;
  api_version?: DecisionApiVersion;
  sdk_version?: DecisionSdkVersion;
}>;

export type DecisionSdkError = Readonly<{
  error_class: DecisionSdkErrorClass;
  message: string;
  fail_closed: true;
}>;

export type ApiInvocationRecord = Readonly<{
  invocation_id: string;
  tenant_id: string;
  mission_id: string;
  api_name: DecisionApiName;
  sdk_version: DecisionSdkVersion;
  contract_version: string;
  replay_reference: string;
  validation_status: "PASS" | "FAIL";
  integrity_hash: string;
  invoked_at: string;
}>;

export type DecisionSdkResponse<T> = Readonly<{
  ok: boolean;
  api_name: DecisionApiName;
  data?: T;
  error?: DecisionSdkError;
  invocation: ApiInvocationRecord;
}>;

export type ContractInspection = Readonly<{
  orchestration_id: string;
  tenant_id: string;
  mission_id: string;
  contract_version: string;
  compatibility_version: string;
  integrity_algorithm: string;
  advisory_only: boolean;
  governance_required: boolean;
  constitutional_required: boolean;
  replay_required: boolean;
  integrity_required: boolean;
}>;

export type SdkCompatibilityResult = Readonly<{
  compatible: boolean;
  producer_version: string;
  consumer_version: string;
  errors: readonly DecisionSdkError[];
}>;

export type DecisionBuilderResult = Readonly<{
  input: DecisionInput;
  record: DecisionOrchestrationRecord;
}>;

export type ReplayBuilderResult = Readonly<{
  replay_contract: DecisionReplayLineageContract;
  replay_reference_ids: readonly string[];
}>;

export type LineageBuilderResult = Readonly<{
  replay_contract: DecisionReplayLineageContract;
  lineage_id: string;
  parent_decision_id?: string;
  child_decision_ids: readonly string[];
}>;

export type IntegrityBuilderResult = Readonly<{
  integrity_evaluation: DecisionIntegrityEvaluation;
  integrity_hash: string;
}>;

export type DecisionSdkBuilderSet = Readonly<{
  DecisionBuilder: () => DecisionBuilderResult;
  MetadataBuilder: () => DecisionMetadata;
  ReplayBuilder: () => ReplayBuilderResult;
  LineageBuilder: () => LineageBuilderResult;
  IntegrityBuilder: () => IntegrityBuilderResult;
}>;

export type SerializedDecisionEnvelope = Readonly<{
  serialization_version: "decision-sdk-canonical-json/v1";
  api_version: DecisionApiVersion;
  payload_type: "decision";
  payload: string;
  integrity_hash: string;
}>;

export type DecisionSdkObservability = Readonly<{
  api_invocation_count: number;
  sdk_version_adoption: Readonly<Record<string, number>>;
  api_latency_ms: number;
  validation_latency_ms: number;
  serialization_latency_ms: number;
  replay_success_rate: number;
  compatibility_failures: number;
  authentication_failures: number;
  error_classifications: Readonly<Record<DecisionSdkErrorClass, number>>;
  integration_success_rate: number;
}>;

export type DecisionSdkContract = Readonly<{
  sdk_version: DecisionSdkVersion;
  api_version: DecisionApiVersion;
  supported_error_classes: readonly DecisionSdkErrorClass[];
  compatible_validation_error_classes: readonly DecisionValidationErrorClass[];
}>;

export type DecisionSdkClient = Readonly<{
  context: DecisionSdkContext;
  contract: DecisionSdkContract;
  builders: DecisionSdkBuilderSet;
  invocations: () => readonly ApiInvocationRecord[];
}>;
