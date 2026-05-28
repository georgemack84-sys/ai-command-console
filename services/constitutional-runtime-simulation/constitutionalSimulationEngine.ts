import type {
  ConstitutionalRuntimeSimulationInput,
  ConstitutionalRuntimeSimulationResult,
  SimulationAuthorityStatus,
  SimulationExecutionStatus,
  SimulationLineageEntry,
  SimulationOutcome,
  SimulationScenarioDefinition,
  SimulationScenarioTrace,
} from "./simulationStateTypes";
import { validateSimulationInput } from "./simulationSchemas";
import { loadSimulationScenarios } from "./simulationScenarioLoader";
import { runAutonomyStressFramework } from "./autonomyStressFramework";
import { validateSimulationIsolationBoundary } from "./simulationIsolationBoundary";
import { validateSimulationAuthorityFirewall } from "./simulationAuthorityFirewall";
import { validateSimulationGovernanceBinding } from "./simulationGovernanceBindingValidator";
import { validateSimulationReplayBinding } from "./simulationReplayBindingValidator";
import { analyzeSimulationContainmentPressure } from "./containmentPressureAnalyzer";
import { validateSimulationContainment } from "./simulationContainmentValidator";
import { validateSimulationDeterminism } from "./simulationDeterminismValidator";
import { appendSimulationLedger, appendSimulationLineage } from "./immutableSimulationLineageLog";
import { bundleSimulationEvidence } from "./simulationEvidenceBundler";
import { exportSimulationArtifacts } from "./simulationExportEngine";
import { hashSimulationValue } from "./simulationTraceHasher";

function outcomeFromErrors(errorCount: number, triggeredCritical: boolean, operatorTriggered: boolean): SimulationOutcome {
  if (triggeredCritical) {
    return "FAILED_CLOSED";
  }
  if (errorCount > 0) {
    return operatorTriggered ? "REQUIRES_OPERATOR_REVIEW" : "DISPUTED";
  }
  return "PASSED";
}

function buildScenarioTraces(input: {
  scenarioDefinitions: readonly SimulationScenarioDefinition[];
  signals: readonly ConstitutionalRuntimeSimulationResult["signals"][number][];
}): readonly SimulationScenarioTrace[] {
  return Object.freeze(input.scenarioDefinitions.map((scenario) => {
    const matchingSignal = input.signals.find((signal) =>
      (scenario.scenarioType === "ESCALATION_PROPAGATION" && signal.domain === "escalation_propagation")
      || (scenario.scenarioType === "AUTHORITY_REVOCATION" && signal.domain === "authority_revocation")
      || (scenario.scenarioType === "COORDINATION_STRESS" && signal.domain === "coordination_stress")
      || (scenario.scenarioType === "GOVERNANCE_CONFLICT" && signal.domain === "governance_conflict")
      || (scenario.scenarioType === "REPLAY_FAILURE" && signal.domain === "replay_failure")
      || (scenario.scenarioType === "OPERATOR_INTERVENTION" && signal.domain === "operator_intervention")
      || (scenario.scenarioType === "RUNTIME_INSTABILITY" && signal.domain === "runtime_instability")
      || (scenario.scenarioType === "CONTAINMENT_PRESSURE" && signal.domain === "containment_pressure"));
    const outcome: SimulationOutcome = !matchingSignal || !matchingSignal.triggered
      ? "PASSED"
      : matchingSignal.severity === "critical"
        ? "FAILED_CLOSED"
        : matchingSignal.domain === "operator_intervention"
          ? "REQUIRES_OPERATOR_REVIEW"
          : "UNSTABLE";
    return Object.freeze({
      scenarioId: scenario.scenarioId,
      scenarioType: scenario.scenarioType,
      outcome,
      escalationRequired: Boolean(matchingSignal?.triggered),
      operatorReviewRequired: outcome === "REQUIRES_OPERATOR_REVIEW" || outcome === "FAILED_CLOSED",
      constitutionalViolations: Object.freeze(matchingSignal?.triggered ? [matchingSignal.reason] : []),
      traceHash: hashSimulationValue("constitutional-runtime-simulation-scenario-trace", {
        scenarioId: scenario.scenarioId,
        outcome,
        triggered: matchingSignal?.triggered ?? false,
      }),
    });
  }));
}

export function buildConstitutionalRuntimeSimulation(
  input: ConstitutionalRuntimeSimulationInput,
): ConstitutionalRuntimeSimulationResult {
  const schemaErrors = validateSimulationInput(input);
  const scenarioDefinitions = loadSimulationScenarios(input);
  const signals = runAutonomyStressFramework(input);
  const isolationErrors = validateSimulationIsolationBoundary(input);
  const authorityErrors = validateSimulationAuthorityFirewall(input);
  const governanceBinding = validateSimulationGovernanceBinding(input);
  const replayBinding = validateSimulationReplayBinding(input);
  const scenarioTraces = buildScenarioTraces({
    scenarioDefinitions,
    signals,
  });
  const containmentState = analyzeSimulationContainmentPressure({
    simulationInput: input,
    signals,
  });
  const containmentErrors = validateSimulationContainment({
    simulationInput: input,
    containmentState,
  });
  const determinismErrors = validateSimulationDeterminism({
    simulationInput: input,
    traces: scenarioTraces,
    signals,
  });
  const errors = Object.freeze([
    ...schemaErrors,
    ...isolationErrors,
    ...authorityErrors,
    ...governanceBinding.errors,
    ...replayBinding.errors,
    ...containmentErrors,
    ...determinismErrors,
  ]);

  const criticalTriggered = signals.some((signal) => signal.triggered && signal.severity === "critical")
    || errors.length > 0;
  const operatorTriggered = signals.some((signal) => signal.domain === "operator_intervention" && signal.triggered);
  const outcome = outcomeFromErrors(errors.length, criticalTriggered, operatorTriggered);
  const constitutionalViolations = Object.freeze([
    ...errors.map((error) => error.code),
    ...scenarioTraces.flatMap((trace) => trace.constitutionalViolations),
  ]);
  const report = Object.freeze({
    simulationId: input.simulationId,
    advisoryOnly: true as const,
    executable: false as const,
    runtimeMutationAllowed: false as const,
    authorityMutationAllowed: false as const,
    schedulingAllowed: false as const,
    orchestrationAllowed: false as const,
    governanceMutationAllowed: false as const,
    authorityStatus: "MODELED_ONLY" as const,
    outcome,
    escalationRequired: signals.some((signal) => signal.domain === "escalation_propagation" && signal.triggered),
    containmentPressureScore: containmentState.containmentPressureScore,
    constitutionalViolations,
    simulationTraceHash: hashSimulationValue("constitutional-runtime-simulation-report", {
      simulationId: input.simulationId,
      outcome,
      containmentPressureScore: containmentState.containmentPressureScore,
      constitutionalViolations,
    }),
    operatorReviewRequired: outcome === "FAILED_CLOSED" || outcome === "REQUIRES_OPERATOR_REVIEW",
  });
  const evidence = bundleSimulationEvidence({
    simulationInput: input,
    reasons: Object.freeze(errors.map((error) => error.code)),
  });
  const lineageEntry: SimulationLineageEntry = Object.freeze({
    entryId: hashSimulationValue("constitutional-runtime-simulation-lineage-entry-id", {
      simulationId: input.simulationId,
      createdAt: input.createdAt,
    }),
    simulationId: input.simulationId,
    coordinationId: input.constitutionalReplayResult.record.coordinationId,
    outcome,
    createdAt: input.createdAt,
    deterministicHash: hashSimulationValue("constitutional-runtime-simulation-lineage-entry", {
      simulationId: input.simulationId,
      outcome,
      evidenceHash: evidence.evidenceHash,
    }),
  });
  const lineage = appendSimulationLineage({
    existing: input.existingLineage,
    entry: lineageEntry,
  });
  const primaryLedger = appendSimulationLedger({
    existing: input.existingReplayLedger,
    payload: Object.freeze({
      event: "constitutional.runtime.simulation.recorded",
      simulationId: input.simulationId,
      outcome,
      evidenceHash: evidence.evidenceHash,
      lineageHash: lineage.lineageHash,
    }),
    scope: "constitutional-runtime-simulation",
  });
  const replayLedger = appendSimulationLedger({
    existing: primaryLedger,
    payload: Object.freeze({
      event: outcome === "PASSED" ? "constitutional.runtime.simulation.certified" : "constitutional.runtime.simulation.failed_closed",
      simulationId: input.simulationId,
      outcome,
      reportHash: report.simulationTraceHash,
      containmentHash: containmentState.containmentHash,
    }),
    scope: "constitutional-runtime-simulation-audit",
  });
  const exportArtifact = exportSimulationArtifacts({
    simulationId: input.simulationId,
    evidence,
    lineage,
    report,
    scenarioHash: hashSimulationValue("constitutional-runtime-simulation-scenarios", scenarioTraces.map((trace) => trace.traceHash)),
  });

  const result: ConstitutionalRuntimeSimulationResult = Object.freeze({
    report,
    authorityStatus: "MODELED_ONLY" as SimulationAuthorityStatus,
    executionStatus: Object.freeze([
      "EXECUTION_FORBIDDEN",
      "SCHEDULING_FORBIDDEN",
      "RUNTIME_MUTATION_FORBIDDEN",
    ]) as readonly SimulationExecutionStatus[],
    replayBinding: replayBinding.replayBinding,
    governanceBinding: governanceBinding.governanceBinding,
    containmentState,
    scenarioDefinitions,
    scenarioTraces,
    signals,
    evidence,
    lineage,
    replayLedger,
    export: exportArtifact,
    warnings: Object.freeze(outcome === "PASSED"
      ? ["Constitutional runtime simulation remained advisory-only, deterministic, and non-executing."]
      : ["Constitutional runtime simulation tightened oversight and remained non-authoritative."]),
    errors,
    deterministicHash: hashSimulationValue("constitutional-runtime-simulation-result", {
      simulationId: input.simulationId,
      reportHash: report.simulationTraceHash,
      evidenceHash: evidence.evidenceHash,
      lineageHash: lineage.lineageHash,
      exportHash: exportArtifact.exportHash,
    }),
    derivedOnly: true as const,
  });
  return result;
}
