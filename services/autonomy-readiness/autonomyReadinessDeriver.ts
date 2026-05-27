import type { AutonomyLevel, AutonomyReadinessInput, AutonomyReadinessProfile } from "@/types/autonomy-readiness";
import { projectAuthorityCeiling } from "./authorityCeilingProjector";
import { bindAutonomyGovernance } from "./autonomyGovernanceBinder";
import { bindAutonomyReplay } from "./autonomyReplayBinder";
import { classifyAutonomySimulation } from "./autonomySimulationClassifier";
import { buildAutonomyDisputes } from "./autonomyDisputeEngine";
import { deriveAutonomyState } from "./autonomyStateMachine";
import { validateAutonomyReadiness } from "./autonomyValidator";
import { guardAutonomyReadinessInput } from "./autonomyGuards";
import { hashAutonomyReadinessValue } from "./autonomyHasher";

function deriveLevel(input: AutonomyReadinessInput): AutonomyLevel {
  const level = input.governanceView.autonomyBoundary.currentLevel;
  if (level === "A0" || level === "A1" || level === "A2" || level === "A3" || level === "A4" || level === "A5") {
    return level;
  }
  return "A6";
}

export function deriveAutonomyReadinessProfile(input: AutonomyReadinessInput): AutonomyReadinessProfile {
  const guardErrors = guardAutonomyReadinessInput(input);
  const currentLevel = deriveLevel(input);
  const governanceBinding = bindAutonomyGovernance(input);
  const replayBinding = bindAutonomyReplay(input);
  const authorityCeiling = projectAuthorityCeiling(input, currentLevel);
  const simulationClassification = classifyAutonomySimulation(currentLevel);
  const snapshotLineageHashes = Object.freeze(input.source.snapshots.map((snapshot) => snapshot.lineageId).filter(Boolean).sort((left, right) => left.localeCompare(right)));
  const capabilityDriftDetected =
    input.source.consoleView.autonomy.autonomyLevel !== input.governanceView.autonomyBoundary.currentLevel
    || currentLevel === "A6";
  const overCeiling = currentLevel !== authorityCeiling.ceilingLevel
    && !authorityCeiling.permittedStates.includes("simulation_only");
  const disputes = buildAutonomyDisputes({
    source: input,
    currentLevel,
    governanceDisputed: governanceBinding.disputed,
    replayDisputed: replayBinding.disputed,
    snapshotLineageMissing: snapshotLineageHashes.length === 0,
    capabilityDriftDetected,
  });
  const validationErrors = validateAutonomyReadiness({
    source: input,
    currentLevel,
    governanceDisputed: governanceBinding.disputed || guardErrors.includes("AUTONOMY_GOVERNANCE_UNBOUND"),
    replayDisputed: replayBinding.disputed || guardErrors.includes("AUTONOMY_REPLAY_UNBOUND"),
    snapshotLineageMissing: snapshotLineageHashes.length === 0 || guardErrors.includes("AUTONOMY_SNAPSHOT_UNBOUND"),
    overCeiling,
    simulationClassification: simulationClassification.classification,
  });
  const derivedState = deriveAutonomyState({
    level: currentLevel,
    governanceDenied: input.governanceView.state === "DENY" || validationErrors.some((error) => error.code === "AUTONOMY_SCOPE_EXCEEDED" || error.code === "AUTONOMY_FORBIDDEN"),
    governanceDisputed: governanceBinding.disputed,
    replayDisputed: replayBinding.disputed,
    snapshotLineageMissing: snapshotLineageHashes.length === 0,
    overCeiling,
    disputes,
  });
  const escalationBinding = Object.freeze({
    escalationRequired: input.governanceView.state !== "ALLOW" || disputes.length > 0,
    escalationRoutes: input.governanceView.escalationAuthority.escalationRoutes,
    overrideEligible: input.governanceView.escalationAuthority.overrideEligible,
    selfAuthorizationForbidden: true as const,
  });
  const warnings = Object.freeze([
    ...input.governanceView.warnings,
    ...(currentLevel === "A6" ? ["A6 remains permanently forbidden."] : []),
    ...(["A3", "A4", "A5"].includes(currentLevel) ? [`${currentLevel} remains a future-bound concept only.`] : []),
  ]);
  const errors = Object.freeze([
    ...validationErrors,
    ...guardErrors.map((code) => ({ code: code as AutonomyReadinessProfile["errors"][number]["code"], message: code.replaceAll("_", " ").toLowerCase() })),
  ]);
  const readinessHash = hashAutonomyReadinessValue("autonomy-readiness-profile", {
    missionId: input.missionId,
    executionId: input.executionId,
    currentLevel,
    derivedState,
    governanceBinding,
    replayBinding,
    authorityCeiling,
    escalationBinding,
    snapshotLineageHashes,
    simulationClassification,
    capabilityDriftDetected,
    disputes,
    warnings,
    errors,
  });

  return Object.freeze({
    profileId: hashAutonomyReadinessValue("autonomy-readiness-profile-id", {
      missionId: input.missionId,
      executionId: input.executionId,
      generatedAt: input.generatedAt,
      currentLevel,
    }),
    missionId: input.missionId,
    executionId: input.executionId,
    generatedAt: input.generatedAt,
    autonomyLevel: currentLevel,
    derivedState,
    authorityCeiling,
    governanceBinding,
    replayBinding,
    escalationBinding,
    snapshotLineageHashes,
    simulationClassification,
    capabilityDriftDetected,
    disputes,
    warnings,
    errors,
    readinessHash,
  });
}
