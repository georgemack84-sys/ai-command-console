import { canonicalizeConfidenceToString } from "./confidenceCanonicalizer";
import { hashConfidenceValue } from "./confidenceHashEngine";
import type { GovernanceAwareCautionBridgeResult } from "./governanceAwareCautionBridge";
import type { EscalationRecommendation } from "./riskEscalationLayer";
import type { ContainmentRecommendation } from "./scopeTighteningFramework";

export type ConfidenceReplayPhase =
  | "GOVERNANCE_AWARE_CAUTION"
  | "RISK_ESCALATION"
  | "SCOPE_TIGHTENING";

export type ConfidenceReplayStatus =
  | "REPLAY_VERIFIED"
  | "FAIL_REPLAY"
  | "FREEZE_REPLAY_RESULT";

export type ConfidenceReplayReasonCode =
  | "TENANT_MISMATCH"
  | "RECOMMENDATION_MISMATCH"
  | "LINEAGE_MISSING"
  | "HASH_MISMATCH"
  | "INPUT_HASH_MISSING"
  | "OUTPUT_HASH_MISSING"
  | "VERSION_MISSING"
  | "POLICY_REFERENCE_MISSING"
  | "CHRONOLOGY_BROKEN"
  | "PARTIAL_LINEAGE"
  | "REPLAY_INCOMPLETE"
  | "AUTHORITY_BOUNDARY_PRESERVED";

export type PhaseOutput =
  | GovernanceAwareCautionBridgeResult
  | EscalationRecommendation
  | ContainmentRecommendation;

export type ConfidenceLineageRecord = Readonly<{
  lineage_id: string;
  source_phase: ConfidenceReplayPhase;
  tenant_id: string;
  recommendation_id: string;
  parent_lineage_ids: readonly string[];
  input_hash: string;
  output_hash: string;
  policy_versions: readonly string[];
  weight_versions: readonly string[];
  reason_codes: readonly string[];
  timestamp: string;
  version: string;
  phase_output: PhaseOutput;
  lineage_hash: string;
}>;

export type LineageReferenceChain = Readonly<{
  tenant_id: string;
  recommendation_id: string;
  records: readonly ConfidenceLineageRecord[];
  backward_trace: readonly string[];
  forward_trace: readonly string[];
  chain_hash: string;
}>;

export type ReplayHashVerification = Readonly<{
  valid: boolean;
  checked_hashes: readonly Readonly<{
    phase: ConfidenceReplayPhase;
    expected_input_hash: string;
    actual_input_hash: string;
    expected_output_hash: string;
    actual_output_hash: string;
    matched: boolean;
  }>[];
  reasons: readonly ConfidenceReplayReasonCode[];
}>;

export type ReplayCertification = Readonly<{
  certified: boolean;
  deterministic: boolean;
  replayable: boolean;
  read_only: true;
  governance_authoritative: true;
  authority_bounded: true;
  tenant_isolated: boolean;
  certification_hash: string;
}>;

export type ConfidenceReplayRequest = Readonly<{
  tenant_id: string;
  recommendation_id: string;
  lineage_records: readonly ConfidenceLineageRecord[];
  replay_timestamp: string;
  version: string;
}>;

export type ConfidenceReplayResult = Readonly<{
  recommendation_id: string;
  tenant_id: string;
  replay_status: ConfidenceReplayStatus;
  reconstructed_outputs: Readonly<{
    caution?: GovernanceAwareCautionBridgeResult;
    escalation?: EscalationRecommendation;
    containment?: ContainmentRecommendation;
  }>;
  source_phase_outputs: readonly PhaseOutput[];
  reason_codes: readonly ConfidenceReplayReasonCode[];
  policy_versions: readonly string[];
  weight_versions: readonly string[];
  lineage_chain: LineageReferenceChain;
  input_hash_validation: ReplayHashVerification;
  output_hash_validation: ReplayHashVerification;
  chronology_validation: Readonly<{
    valid: boolean;
    ordered_lineage_ids: readonly string[];
    reasons: readonly ConfidenceReplayReasonCode[];
  }>;
  replay_timestamp: string;
  version: string;
  certification: ReplayCertification;
  replay_hash: string;
  replay_mode: "READ_ONLY";
  advisory_only: true;
  authority_changed: false;
  mutation_performed: false;
  execution_permitted: false;
  may_execute: false;
  may_schedule: false;
  may_mutate_state: false;
  may_change_approval: false;
  may_change_authority: false;
  may_route_workflow: false;
}>;

const PHASE_ORDER: Record<ConfidenceReplayPhase, number> = Object.freeze({
  GOVERNANCE_AWARE_CAUTION: 0,
  RISK_ESCALATION: 1,
  SCOPE_TIGHTENING: 2,
});

function normalizeStrings(values: readonly string[]): readonly string[] {
  return Object.freeze([...new Set(values.filter((value) => value.length > 0))].sort());
}

function outputRecommendationId(output: PhaseOutput): string {
  return "recommendationId" in output ? output.recommendationId : output.recommendation_id;
}

function outputTenantId(output: PhaseOutput, fallbackTenantId: string): string {
  return "tenant_id" in output ? output.tenant_id : fallbackTenantId;
}

function outputHash(output: PhaseOutput): string {
  if ("canonicalBridgeHash" in output) return output.canonicalBridgeHash;
  return output.evaluation_hash;
}

function outputReasons(output: PhaseOutput): readonly string[] {
  if ("reasonCodes" in output) return output.reasonCodes;
  return output.reason_codes;
}

function outputPolicyVersions(output: PhaseOutput): readonly string[] {
  if ("policy_references" in output) return output.policy_references;
  return Object.freeze([]);
}

function outputWeightVersions(output: PhaseOutput): readonly string[] {
  if ("pressure_weights" in output) return Object.freeze([output.pressure_weights.version]);
  if ("lineage" in output && "weight_version" in output.lineage) return Object.freeze([output.lineage.weight_version]);
  return Object.freeze([]);
}

function outputTimestamp(output: PhaseOutput, fallbackTimestamp: string): string {
  if ("timestamp" in output) return output.timestamp;
  return fallbackTimestamp;
}

function outputVersion(output: PhaseOutput, fallbackVersion: string): string {
  if ("version" in output) return output.version;
  return fallbackVersion;
}

function outputInputHash(output: PhaseOutput): string {
  if ("input_hash" in output) return output.input_hash;
  if ("deterministicHash" in output) return output.deterministicHash;
  return "";
}

function phaseLabel(phase: ConfidenceReplayPhase): string {
  return phase.toLowerCase().replaceAll("_", "-");
}

export function buildConfidenceLineageRecord(input: {
  source_phase: ConfidenceReplayPhase;
  tenant_id: string;
  recommendation_id?: string;
  parent_lineage_ids?: readonly string[];
  phase_output: PhaseOutput;
  timestamp?: string;
  version?: string;
  policy_versions?: readonly string[];
  weight_versions?: readonly string[];
}): ConfidenceLineageRecord {
  const recommendationId = input.recommendation_id ?? outputRecommendationId(input.phase_output);
  const tenantId = outputTenantId(input.phase_output, input.tenant_id);
  const timestamp = input.timestamp ?? outputTimestamp(input.phase_output, "");
  const version = input.version ?? outputVersion(input.phase_output, "");
  const policyVersions = normalizeStrings(input.policy_versions ?? outputPolicyVersions(input.phase_output));
  const weightVersions = normalizeStrings(input.weight_versions ?? outputWeightVersions(input.phase_output));
  const parentLineageIds = normalizeStrings(input.parent_lineage_ids ?? []);
  const core = Object.freeze({
    source_phase: input.source_phase,
    tenant_id: tenantId,
    recommendation_id: recommendationId,
    parent_lineage_ids: parentLineageIds,
    input_hash: outputInputHash(input.phase_output),
    output_hash: outputHash(input.phase_output),
    policy_versions: policyVersions,
    weight_versions: weightVersions,
    reason_codes: normalizeStrings(outputReasons(input.phase_output)),
    timestamp,
    version,
    phase_output: input.phase_output,
  });
  const lineageHash = hashConfidenceValue("confidence-lineage-record", canonicalizeConfidenceToString(core));

  return Object.freeze({
    lineage_id: `confidence-lineage:${phaseLabel(input.source_phase)}:${lineageHash}`,
    ...core,
    lineage_hash: lineageHash,
  });
}

export function buildLineageGraph(records: readonly ConfidenceLineageRecord[]): LineageReferenceChain {
  const ordered = Object.freeze([...records].sort((left, right) =>
    PHASE_ORDER[left.source_phase] - PHASE_ORDER[right.source_phase]
    || left.timestamp.localeCompare(right.timestamp)
    || left.lineage_id.localeCompare(right.lineage_id)));
  const tenantId = ordered[0]?.tenant_id ?? "";
  const recommendationId = ordered[0]?.recommendation_id ?? "";
  const backwardTrace = Object.freeze([...ordered].reverse().map((record) => record.lineage_id));
  const forwardTrace = Object.freeze(ordered.map((record) => record.lineage_id));
  const chainCore = Object.freeze({
    tenant_id: tenantId,
    recommendation_id: recommendationId,
    records: ordered.map((record) => ({
      lineage_id: record.lineage_id,
      source_phase: record.source_phase,
      lineage_hash: record.lineage_hash,
      parent_lineage_ids: record.parent_lineage_ids,
      output_hash: record.output_hash,
    })),
    backward_trace: backwardTrace,
    forward_trace: forwardTrace,
  });

  return Object.freeze({
    tenant_id: tenantId,
    recommendation_id: recommendationId,
    records: ordered,
    backward_trace: backwardTrace,
    forward_trace: forwardTrace,
    chain_hash: hashConfidenceValue("confidence-lineage-chain", canonicalizeConfidenceToString(chainCore)),
  });
}

export function validateReplayRequest(request: ConfidenceReplayRequest): readonly ConfidenceReplayReasonCode[] {
  const reasons: ConfidenceReplayReasonCode[] = [];

  if (request.lineage_records.length === 0) reasons.push("LINEAGE_MISSING");
  if (request.version.length === 0) reasons.push("VERSION_MISSING");
  if (request.lineage_records.length > 0 && request.lineage_records.length < 3) reasons.push("PARTIAL_LINEAGE");
  for (const record of request.lineage_records) {
    if (record.tenant_id !== request.tenant_id) reasons.push("TENANT_MISMATCH");
    if (record.recommendation_id !== request.recommendation_id) reasons.push("RECOMMENDATION_MISMATCH");
    if (record.input_hash.length === 0) reasons.push("INPUT_HASH_MISSING");
    if (record.output_hash.length === 0) reasons.push("OUTPUT_HASH_MISSING");
    if (record.version.length === 0) reasons.push("VERSION_MISSING");
    if (record.source_phase !== "GOVERNANCE_AWARE_CAUTION" && record.policy_versions.length === 0) {
      reasons.push("POLICY_REFERENCE_MISSING");
    }
  }

  return normalizeStrings(reasons) as readonly ConfidenceReplayReasonCode[];
}

export function verifyReplayHashes(records: readonly ConfidenceLineageRecord[]): ReplayHashVerification {
  const checked = Object.freeze(records.map((record) => {
    const actualInputHash = outputInputHash(record.phase_output);
    const actualOutputHash = outputHash(record.phase_output);

    return Object.freeze({
      phase: record.source_phase,
      expected_input_hash: record.input_hash,
      actual_input_hash: actualInputHash,
      expected_output_hash: record.output_hash,
      actual_output_hash: actualOutputHash,
      matched: record.input_hash.length > 0
        && record.output_hash.length > 0
        && record.input_hash === actualInputHash
        && record.output_hash === actualOutputHash,
    });
  }));
  const reasons: ConfidenceReplayReasonCode[] = [];

  if (checked.some((item) => item.expected_input_hash.length === 0)) reasons.push("INPUT_HASH_MISSING");
  if (checked.some((item) => item.expected_output_hash.length === 0)) reasons.push("OUTPUT_HASH_MISSING");
  if (checked.some((item) => !item.matched)) reasons.push("HASH_MISMATCH");

  return Object.freeze({
    valid: reasons.length === 0,
    checked_hashes: checked,
    reasons: normalizeStrings(reasons) as readonly ConfidenceReplayReasonCode[],
  });
}

export function reconstructChronology(records: readonly ConfidenceLineageRecord[]): ConfidenceReplayResult["chronology_validation"] {
  const chain = buildLineageGraph(records);
  const reasons: ConfidenceReplayReasonCode[] = [];
  const phases = new Set(records.map((record) => record.source_phase));

  if (!phases.has("GOVERNANCE_AWARE_CAUTION") || !phases.has("RISK_ESCALATION") || !phases.has("SCOPE_TIGHTENING")) {
    reasons.push("PARTIAL_LINEAGE");
  }
  for (let index = 1; index < chain.records.length; index += 1) {
    const previous = chain.records[index - 1];
    const current = chain.records[index];
    if (!previous || !current) continue;
    if (PHASE_ORDER[current.source_phase] <= PHASE_ORDER[previous.source_phase]) {
      reasons.push("CHRONOLOGY_BROKEN");
    }
    if (!current.parent_lineage_ids.includes(previous.lineage_id)) {
      reasons.push("CHRONOLOGY_BROKEN");
    }
  }

  return Object.freeze({
    valid: reasons.length === 0,
    ordered_lineage_ids: chain.forward_trace,
    reasons: normalizeStrings(reasons) as readonly ConfidenceReplayReasonCode[],
  });
}

function reconstructOutputs(records: readonly ConfidenceLineageRecord[]): ConfidenceReplayResult["reconstructed_outputs"] {
  const outputs: {
    caution?: GovernanceAwareCautionBridgeResult;
    escalation?: EscalationRecommendation;
    containment?: ContainmentRecommendation;
  } = {};

  for (const record of records) {
    if (record.source_phase === "GOVERNANCE_AWARE_CAUTION") {
      outputs.caution = record.phase_output as GovernanceAwareCautionBridgeResult;
    } else if (record.source_phase === "RISK_ESCALATION") {
      outputs.escalation = record.phase_output as EscalationRecommendation;
    } else if (record.source_phase === "SCOPE_TIGHTENING") {
      outputs.containment = record.phase_output as ContainmentRecommendation;
    }
  }

  return Object.freeze(outputs);
}

function collectVersions(
  records: readonly ConfidenceLineageRecord[],
  field: "policy_versions" | "weight_versions",
): readonly string[] {
  return normalizeStrings(records.flatMap((record) => [...record[field]]));
}

function certifyReplay(input: {
  replayStatus: ConfidenceReplayStatus;
  tenantIsolated: boolean;
  chainHash: string;
  replayHashInput: unknown;
}): ReplayCertification {
  const replayable = input.replayStatus === "REPLAY_VERIFIED";
  const core = Object.freeze({
    replayStatus: input.replayStatus,
    tenantIsolated: input.tenantIsolated,
    chainHash: input.chainHash,
    replayHashInput: input.replayHashInput,
  });

  return Object.freeze({
    certified: replayable,
    deterministic: true,
    replayable,
    read_only: true as const,
    governance_authoritative: true as const,
    authority_bounded: true as const,
    tenant_isolated: input.tenantIsolated,
    certification_hash: hashConfidenceValue("confidence-replay-certification", canonicalizeConfidenceToString(core)),
  });
}

export function replayConfidenceLineage(request: ConfidenceReplayRequest): ConfidenceReplayResult {
  const requestReasons = validateReplayRequest(request);
  const chain = buildLineageGraph(request.lineage_records);
  const hashValidation = verifyReplayHashes(chain.records);
  const chronology = reconstructChronology(chain.records);
  const reconstructedOutputs = reconstructOutputs(chain.records);
  const incomplete = reconstructedOutputs.caution === undefined
    || reconstructedOutputs.escalation === undefined
    || reconstructedOutputs.containment === undefined;
  const allReasons = normalizeStrings([
    ...requestReasons,
    ...hashValidation.reasons,
    ...chronology.reasons,
    ...(incomplete ? ["REPLAY_INCOMPLETE" as const] : []),
  ]) as readonly ConfidenceReplayReasonCode[];
  const tenantIsolated = !allReasons.includes("TENANT_MISMATCH");
  const replayStatus: ConfidenceReplayStatus = allReasons.length === 0
    ? "REPLAY_VERIFIED"
    : allReasons.includes("HASH_MISMATCH")
      || allReasons.includes("LINEAGE_MISSING")
      || allReasons.includes("PARTIAL_LINEAGE")
      || allReasons.includes("CHRONOLOGY_BROKEN")
      || allReasons.includes("VERSION_MISSING")
      || allReasons.includes("POLICY_REFERENCE_MISSING")
      || allReasons.includes("REPLAY_INCOMPLETE")
        ? "FAIL_REPLAY"
        : "FREEZE_REPLAY_RESULT";
  const replayCore = Object.freeze({
    recommendation_id: request.recommendation_id,
    tenant_id: request.tenant_id,
    replay_status: replayStatus,
    reconstructed_outputs: reconstructedOutputs,
    source_phase_hashes: chain.records.map((record) => record.output_hash),
    reason_codes: allReasons,
    policy_versions: collectVersions(chain.records, "policy_versions"),
    weight_versions: collectVersions(chain.records, "weight_versions"),
    chain_hash: chain.chain_hash,
    chronology_valid: chronology.valid,
    replay_timestamp: request.replay_timestamp,
    version: request.version,
  });
  const replayHash = hashConfidenceValue("confidence-lineage-replay", canonicalizeConfidenceToString(replayCore));
  const certification = certifyReplay({
    replayStatus,
    tenantIsolated,
    chainHash: chain.chain_hash,
    replayHashInput: replayCore,
  });

  return Object.freeze({
    ...replayCore,
    source_phase_outputs: Object.freeze(chain.records.map((record) => record.phase_output)),
    lineage_chain: chain,
    input_hash_validation: hashValidation,
    output_hash_validation: hashValidation,
    chronology_validation: chronology,
    certification,
    replay_hash: replayHash,
    replay_mode: "READ_ONLY" as const,
    advisory_only: true as const,
    authority_changed: false as const,
    mutation_performed: false as const,
    execution_permitted: false as const,
    may_execute: false as const,
    may_schedule: false as const,
    may_mutate_state: false as const,
    may_change_approval: false as const,
    may_change_authority: false as const,
    may_route_workflow: false as const,
  });
}

export const ConfidenceLineageEngine = Object.freeze({
  buildRecord: buildConfidenceLineageRecord,
  buildGraph: buildLineageGraph,
});

export const ConfidenceReplayEngine = Object.freeze({
  replay: replayConfidenceLineage,
});

export const LineageIntegrityValidator = Object.freeze({
  validate: validateReplayRequest,
});

export const ReplayCertificationService = Object.freeze({
  certify: certifyReplay,
});

export const LineageGraphBuilder = Object.freeze({
  build: buildLineageGraph,
});

export const ChronologyReconstructionService = Object.freeze({
  reconstruct: reconstructChronology,
});

export const HashVerificationService = Object.freeze({
  verify: verifyReplayHashes,
});

export const ReplayReasonGenerator = Object.freeze({
  generate: validateReplayRequest,
});

export const ReplayBoundaryValidator = Object.freeze({
  validateTenant: (record: ConfidenceLineageRecord, tenantId: string) => record.tenant_id === tenantId,
});

export const ReplayRequestValidator = Object.freeze({
  validate: validateReplayRequest,
});
