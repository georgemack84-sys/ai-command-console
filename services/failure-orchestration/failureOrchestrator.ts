import type {
  CascadeSuppressionResult,
  ContainmentDirective,
  FailureGraphNode,
  FailureOrchestrationInput,
  FailureOrchestrationResult,
  FailurePropagationResult,
  FailureSignal,
  ImmutableFailureSnapshot,
  RecoveryReactivationDecision,
  RuntimeSafetyMode,
  SurvivabilityState,
  TrustRehydrationResult,
} from "./failureOrchestrationTypes";
import {
  FAILURE_ORCHESTRATION_CODES,
  hashFailurePayload,
} from "./failureOrchestrationTypes";

const MODE_ORDER: readonly RuntimeSafetyMode[] = [
  "FULL_CONTAINMENT",
  "RECOVERY_ONLY",
  "OBSERVATION_ONLY",
  "RESTRICTED",
  "NORMAL",
] as const;

function failure(
  domain: FailureSignal["domain"],
  type: FailureSignal["type"],
  code: FailureSignal["code"],
  message: string,
  path?: string,
  expected?: unknown,
  actual?: unknown,
): FailureSignal {
  return { domain, type, code, message, path, expected, actual };
}

function dedupeSignals(signals: readonly FailureSignal[]): readonly FailureSignal[] {
  const byKey = new Map<string, FailureSignal>();
  for (const signal of signals) {
    byKey.set(`${signal.domain}:${signal.type}:${signal.code}:${signal.path ?? ""}`, signal);
  }
  return [...byKey.values()];
}

function deriveUpstreamSignals(input: FailureOrchestrationInput): readonly FailureSignal[] {
  const signals: FailureSignal[] = [];

  if (!input.trustedSnapshotAdmission.ok) {
    signals.push(
      failure(
        "registry",
        "TRUST_CHAIN_BROKEN",
        FAILURE_ORCHESTRATION_CODES.FAILURE_SNAPSHOT_UNCERTAIN,
        "trusted registry snapshot admission failed",
        "trustedSnapshotAdmission",
      ),
    );
  }

  if (!input.zoneAdmission.allowed) {
    signals.push(
      failure(
        "execution",
        "STATE_UNCERTAIN",
        FAILURE_ORCHESTRATION_CODES.FAILURE_STATE_UNSAFE_UNKNOWN,
        "zone admission denied execution under fail-closed containment",
        "zoneAdmission",
      ),
    );
  }

  if (!input.runtimeValidation.allowed || input.runtimeValidation.trustState !== "certified") {
    signals.push(
      failure(
        "execution",
        "STATE_UNCERTAIN",
        FAILURE_ORCHESTRATION_CODES.FAILURE_STATE_UNSAFE_UNKNOWN,
        "runtime validation is not certified",
        "runtimeValidation.trustState",
        "certified",
        input.runtimeValidation.trustState,
      ),
    );
  }

  if (!input.runtimeValidation.attestation.valid) {
    signals.push(
      failure(
        "replay",
        "REPLAY_MISMATCH",
        FAILURE_ORCHESTRATION_CODES.FAILURE_REPLAY_MISMATCH,
        "runtime replay attestation is invalid",
        "runtimeValidation.attestation",
      ),
    );
  }

  if (input.runtimeValidation.drift.driftDetected) {
    signals.push(
      failure(
        "execution",
        "CASCADE_RISK_DETECTED",
        FAILURE_ORCHESTRATION_CODES.FAILURE_CASCADE_SUPPRESSED,
        "runtime drift was detected and must be suppressed",
        "runtimeValidation.drift",
      ),
    );
  }

  const governanceDrift = input.runtimeValidation.failures.find((item) => item.code === "RUNTIME_GOVERNANCE_DRIFT");
  if (governanceDrift) {
    signals.push(
      failure(
        "governance",
        "GOVERNANCE_MISMATCH",
        FAILURE_ORCHESTRATION_CODES.FAILURE_GOVERNANCE_MISMATCH,
        governanceDrift.message,
        governanceDrift.path,
        governanceDrift.expected,
        governanceDrift.actual,
      ),
    );
  }

  if (input.replayRequested && !input.zoneAdmission.allowed) {
    signals.push(
      failure(
        "replay",
        "REPLAY_MISMATCH",
        FAILURE_ORCHESTRATION_CODES.FAILURE_REPLAY_MISMATCH,
        "replay requested under denied containment state",
        "replayRequested",
      ),
    );
  }

  if (input.freezeBypassAttempted || input.containmentEscapeAttempted) {
    signals.push(
      failure(
        "execution",
        "UNKNOWN_FAILURE",
        FAILURE_ORCHESTRATION_CODES.FAILURE_BYPASS_ATTEMPT,
        "freeze or containment bypass attempt detected",
      ),
    );
  }

  if (input.recoveryEscalationAttempted) {
    signals.push(
      failure(
        "recovery",
        "RECOVERY_TRUST_INVALID",
        FAILURE_ORCHESTRATION_CODES.FAILURE_RECOVERY_TRUST_INVALID,
        "recovery escalation attempt bypassed staged reactivation",
      ),
    );
  }

  if (input.forgedRecoveryManifest || input.replayRecoveryTampered) {
    signals.push(
      failure(
        "recovery",
        "RECOVERY_TRUST_INVALID",
        FAILURE_ORCHESTRATION_CODES.FAILURE_FORGED_RECOVERY_MANIFEST,
        "recovery manifest or replay recovery evidence is forged or tampered",
      ),
    );
  }

  return signals;
}

function buildFailureGraph(signals: readonly FailureSignal[]): readonly FailureGraphNode[] {
  return signals.map((signal) => ({
    domain: signal.domain,
    type: signal.type,
    severity:
      signal.code === FAILURE_ORCHESTRATION_CODES.FAILURE_STATE_UNSAFE_UNKNOWN ||
      signal.code === FAILURE_ORCHESTRATION_CODES.FAILURE_REPLAY_MISMATCH ||
      signal.code === FAILURE_ORCHESTRATION_CODES.FAILURE_GOVERNANCE_MISMATCH
        ? "critical"
        : signal.code === FAILURE_ORCHESTRATION_CODES.FAILURE_CASCADE_SUPPRESSED
          ? "high"
          : "medium",
    hash: hashFailurePayload("EVIDENCE_BUNDLE", signal),
  }));
}

function buildContainment(signals: readonly FailureSignal[]): readonly ContainmentDirective[] {
  const directives: ContainmentDirective[] = [];
  if (signals.length > 0) {
    directives.push({ domain: "execution", action: "deny_execution", reason: "unknown is unsafe" });
  }
  if (signals.some((signal) => signal.domain === "replay")) {
    directives.push({ domain: "replay", action: "deny_replay", reason: "replay mismatch under fail-closed policy" });
  }
  if (signals.some((signal) => signal.domain === "governance")) {
    directives.push({ domain: "governance", action: "freeze_governance", reason: "governance mismatch detected" });
  }
  if (signals.some((signal) => signal.domain === "registry")) {
    directives.push({ domain: "registry", action: "deny_mutation", reason: "frozen registry truth cannot mutate under uncertainty" });
  }
  if (signals.some((signal) => signal.type === "CASCADE_RISK_DETECTED")) {
    directives.push({ domain: "execution", action: "suppress_cascade", reason: "cascade risk detected" });
    directives.push({ domain: "execution", action: "freeze_runtime", reason: "runtime freeze required while cascade is suppressed" });
  }
  directives.push({ domain: "telemetry", action: "preserve_survivability", reason: "telemetry must survive containment" });
  directives.push({ domain: "audit", action: "preserve_survivability", reason: "audit must survive containment" });
  directives.push({ domain: "recovery", action: "allow_recovery_readonly", reason: "recovery tooling remains available in read-only mode" });

  return directives;
}

function deriveRuntimeMode(signals: readonly FailureSignal[]): RuntimeSafetyMode {
  if (signals.length === 0) {
    return "NORMAL";
  }
  if (signals.some((signal) => signal.type === "STATE_UNCERTAIN")) {
    return "FULL_CONTAINMENT";
  }
  if (signals.some((signal) => signal.type === "TRUST_CHAIN_BROKEN" || signal.type === "SIGNATURE_INVALID")) {
    return "FULL_CONTAINMENT";
  }
  if (signals.some((signal) => signal.type === "REPLAY_MISMATCH" || signal.type === "GOVERNANCE_MISMATCH")) {
    return "FULL_CONTAINMENT";
  }
  if (signals.some((signal) => signal.type === "RECOVERY_TRUST_INVALID")) {
    return "RECOVERY_ONLY";
  }
  if (signals.some((signal) => signal.type === "CASCADE_RISK_DETECTED")) {
    return "OBSERVATION_ONLY";
  }
  return "RESTRICTED";
}

function deriveTrustState(mode: RuntimeSafetyMode, signals: readonly FailureSignal[]): ImmutableFailureSnapshot["trustState"] {
  if (mode === "FULL_CONTAINMENT") {
    return "QUARANTINED";
  }
  if (signals.some((signal) => signal.type === "TRUST_CHAIN_BROKEN")) {
    return "REVOKED";
  }
  if (mode === "RECOVERY_ONLY" || mode === "OBSERVATION_ONLY") {
    return "DEGRADED";
  }
  return "HEALTHY";
}

export function computeSurvivabilityState(mode: RuntimeSafetyMode): SurvivabilityState {
  const state = {
    telemetryOperational: true,
    auditOperational: true,
    recoveryOperational: true,
    operatorVisibilityOperational: true,
    immutableEvidenceOperational: true,
    runtimeMode: mode,
  };
  return {
    telemetryOperational: state.telemetryOperational,
    auditOperational: state.auditOperational,
    recoveryOperational: state.recoveryOperational,
    operatorVisibilityOperational: state.operatorVisibilityOperational,
    immutableEvidenceOperational: state.immutableEvidenceOperational,
    survivabilityHash: hashFailurePayload("EVIDENCE_BUNDLE", state),
  };
}

export function propagateFailureSignals(signals: readonly FailureSignal[]): FailurePropagationResult {
  const propagatedSignals = dedupeSignals(signals);
  const containment = buildContainment(propagatedSignals);
  return {
    propagatedSignals,
    containment,
    propagationHash: hashFailurePayload("EVIDENCE_BUNDLE", { propagatedSignals, containment }),
  };
}

export function suppressCascade(
  propagation: FailurePropagationResult,
): CascadeSuppressionResult {
  const activeFreeze = propagation.containment.some((directive) => directive.action === "freeze_runtime" || directive.action === "freeze_governance");
  return {
    suppressed: propagation.propagatedSignals.some((signal) => signal.type === "CASCADE_RISK_DETECTED") || activeFreeze,
    activeFreeze,
    containment: propagation.containment,
    suppressionHash: hashFailurePayload("EVIDENCE_BUNDLE", propagation),
  };
}

export function createImmutableFailureSnapshot(input: {
  registryHash: string;
  runtimeMode: RuntimeSafetyMode;
  trustState: ImmutableFailureSnapshot["trustState"];
  failureGraph: readonly FailureGraphNode[];
  activeContainment: readonly ContainmentDirective[];
  timestamp: string;
}): ImmutableFailureSnapshot {
  const payload = {
    registryHash: input.registryHash,
    trustState: input.trustState,
    runtimeMode: input.runtimeMode,
    failureGraph: input.failureGraph,
    activeContainment: input.activeContainment,
    timestamp: input.timestamp,
  };
  return {
    ...payload,
    snapshotHash: hashFailurePayload("EVIDENCE_BUNDLE", payload),
  };
}

export function decideRecoveryReactivation(input: {
  currentMode: RuntimeSafetyMode;
  requestedMode?: RuntimeSafetyMode;
  signals: readonly FailureSignal[];
  governanceReapproved?: boolean;
  trustedSnapshotAdmission: FailureOrchestrationInput["trustedSnapshotAdmission"];
  recoveryManifestHash?: string;
  expectedRecoveryManifestHash?: string;
}): RecoveryReactivationDecision {
  const requestedMode = input.requestedMode ?? input.currentMode;
  const currentIndex = MODE_ORDER.indexOf(input.currentMode);
  const requestedIndex = MODE_ORDER.indexOf(requestedMode);

  let allowed = true;
  let reasonCode: RecoveryReactivationDecision["reasonCode"];

  if (requestedIndex === -1 || currentIndex === -1) {
    allowed = false;
    reasonCode = FAILURE_ORCHESTRATION_CODES.FAILURE_RECOVERY_STAGE_INVALID;
  } else if (requestedIndex > currentIndex + 1) {
    allowed = false;
    reasonCode = FAILURE_ORCHESTRATION_CODES.FAILURE_RECOVERY_STAGE_INVALID;
  } else if (input.signals.some((signal) => signal.type === "TRUST_CHAIN_BROKEN" || signal.type === "RECOVERY_TRUST_INVALID")) {
    allowed = false;
    reasonCode = FAILURE_ORCHESTRATION_CODES.FAILURE_RECOVERY_TRUST_INVALID;
  } else if (requestedMode !== input.currentMode && !input.governanceReapproved) {
    allowed = false;
    reasonCode = FAILURE_ORCHESTRATION_CODES.FAILURE_RECOVERY_TRUST_INVALID;
  } else if (
    input.recoveryManifestHash !== undefined &&
    input.expectedRecoveryManifestHash !== undefined &&
    input.recoveryManifestHash !== input.expectedRecoveryManifestHash
  ) {
    allowed = false;
    reasonCode = FAILURE_ORCHESTRATION_CODES.FAILURE_FORGED_RECOVERY_MANIFEST;
  } else if (!input.trustedSnapshotAdmission.ok) {
    allowed = false;
    reasonCode = FAILURE_ORCHESTRATION_CODES.FAILURE_RECOVERY_TRUST_INVALID;
  }

  return {
    allowed,
    fromMode: input.currentMode,
    toMode: requestedMode,
    governanceReapprovalRequired: requestedMode !== input.currentMode,
    reasonCode,
    decisionHash: hashFailurePayload("EVIDENCE_BUNDLE", {
      currentMode: input.currentMode,
      requestedMode,
      governanceReapproved: input.governanceReapproved ?? false,
      allowed,
      reasonCode,
    }),
  };
}

export function rehydrateTrust(input: {
  runtimeMode: RuntimeSafetyMode;
  signals: readonly FailureSignal[];
  governanceReapproved?: boolean;
  trustedSnapshotAdmission: FailureOrchestrationInput["trustedSnapshotAdmission"];
}): TrustRehydrationResult {
  const canRehydrate =
    input.trustedSnapshotAdmission.ok &&
    input.governanceReapproved === true &&
    input.signals.length === 0 &&
    input.runtimeMode !== "NORMAL";
  const targetMode = canRehydrate
    ? input.runtimeMode === "FULL_CONTAINMENT"
      ? "RECOVERY_ONLY"
      : input.runtimeMode === "RECOVERY_ONLY"
        ? "OBSERVATION_ONLY"
        : input.runtimeMode === "OBSERVATION_ONLY"
          ? "RESTRICTED"
          : "NORMAL"
    : input.runtimeMode;

  const trustState = canRehydrate
    ? targetMode === "NORMAL"
      ? "HEALTHY"
      : "DEGRADED"
    : input.signals.some((signal) => signal.type === "TRUST_CHAIN_BROKEN")
      ? "REVOKED"
      : input.runtimeMode === "FULL_CONTAINMENT"
        ? "QUARANTINED"
        : "DEGRADED";

  const reasonCode = canRehydrate ? undefined : FAILURE_ORCHESTRATION_CODES.FAILURE_RECOVERY_TRUST_INVALID;

  return {
    allowed: canRehydrate,
    targetMode,
    trustState,
    reasonCode,
    rehydrationHash: hashFailurePayload("EVIDENCE_BUNDLE", {
      runtimeMode: input.runtimeMode,
      targetMode,
      trustState,
      reasonCode,
      governanceReapproved: input.governanceReapproved ?? false,
    }),
  };
}

export function orchestrateFailureState(input: FailureOrchestrationInput): FailureOrchestrationResult {
  const signals = dedupeSignals([
    ...deriveUpstreamSignals(input),
    ...(input.additionalSignals ?? []),
  ]);
  const propagation = propagateFailureSignals(signals);
  const cascadeSuppression = suppressCascade(propagation);
  const runtimeMode = deriveRuntimeMode(signals);
  const trustState = deriveTrustState(runtimeMode, signals);
  const survivability = computeSurvivabilityState(runtimeMode);
  const failureGraph = buildFailureGraph(signals);
  const snapshot = createImmutableFailureSnapshot({
    registryHash: input.snapshot.manifest.registrySnapshotHash,
    runtimeMode,
    trustState,
    failureGraph,
    activeContainment: propagation.containment,
    timestamp: input.timestamp,
  });
  const recovery = decideRecoveryReactivation({
    currentMode: input.currentMode ?? runtimeMode,
    requestedMode: input.requestedRecoveryMode,
    signals,
    governanceReapproved: input.governanceReapproved,
    trustedSnapshotAdmission: input.trustedSnapshotAdmission,
    recoveryManifestHash: input.recoveryManifestHash,
    expectedRecoveryManifestHash: input.expectedRecoveryManifestHash,
  });
  const rehydration = rehydrateTrust({
    runtimeMode,
    signals,
    governanceReapproved: input.governanceReapproved,
    trustedSnapshotAdmission: input.trustedSnapshotAdmission,
  });

  const allowed =
    signals.length === 0 &&
    input.zoneAdmission.allowed &&
    input.runtimeValidation.allowed &&
    input.trustedSnapshotAdmission.ok &&
    runtimeMode === "NORMAL";

  return {
    allowed,
    runtimeMode,
    trustState,
    signals,
    propagation,
    cascadeSuppression,
    survivability,
    snapshot,
    recovery,
    rehydration,
    decisionHash: hashFailurePayload("EVIDENCE_BUNDLE", {
      allowed,
      runtimeMode,
      trustState,
      propagationHash: propagation.propagationHash,
      suppressionHash: cascadeSuppression.suppressionHash,
      survivabilityHash: survivability.survivabilityHash,
      snapshotHash: snapshot.snapshotHash,
      recoveryHash: recovery.decisionHash,
      rehydrationHash: rehydration.rehydrationHash,
    }),
  };
}
