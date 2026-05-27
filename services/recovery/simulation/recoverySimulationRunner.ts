import { appendRecoverySimulationAuditTrail } from "./recoverySimulationAudit";
import { validateRecoverySimulationConstraints } from "./recoverySimulationConstraints";
import { buildRecoverySimulationEvidence } from "./recoverySimulationEvidence";
import { validateRecoverySimulationGovernance } from "./recoverySimulationGovernanceValidator";
import { runRecoverySimulationReplayAdapter } from "./recoverySimulationReplayAdapter";
import { getRecoverySimulationScenario } from "./recoveryScenarioLibrary";
import { validateRecoverySimulationContinuity } from "./recoverySimulationContinuityValidator";
import type { SecurityContext } from "../../security/securityTypes";
import type { TenantContext } from "../../tenancy/tenantTypes";
import type { RecoverySimulationOutcome, RecoverySimulationRequest, RecoverySimulationResult } from "./recoverySimulationTypes";

function decideOutcome({
  replay,
  continuity,
  governanceOk,
}: {
  replay: { divergenceDetected: boolean; warnings: string[]; disputes: string[] };
  continuity: { validated: boolean; warnings: string[]; disputes: string[] };
  governanceOk: boolean;
}): RecoverySimulationOutcome {
  if (replay.divergenceDetected) return "REPLAY_DIVERGENCE_DETECTED";
  if (!governanceOk) return "GOVERNANCE_BLOCKED";
  if (!continuity.validated && continuity.disputes.length > 0) return continuity.disputes.includes("PARTIAL_EXECUTION") ? "CONTAINMENT_REQUIRED" : "CONTINUITY_FAILED";
  if (replay.warnings.length > 0 || continuity.warnings.length > 0) return "RECOVERY_VALID_WITH_WARNINGS";
  return "RECOVERY_VALID";
}

function decideRecommendedAction(outcome: RecoverySimulationOutcome): RecoverySimulationResult["recommendedAction"] {
  switch (outcome) {
    case "REPLAY_DIVERGENCE_DETECTED":
      return "ESCALATE_TO_GOVERNANCE";
    case "CONTINUITY_FAILED":
      return "REQUIRE_RECONCILIATION";
    case "CONTAINMENT_REQUIRED":
      return "CONTAIN_RUNTIME";
    case "GOVERNANCE_BLOCKED":
    case "SIMULATION_FAILED":
    case "EVIDENCE_INCOMPLETE":
      return "BLOCK_RECOVERY_PATTERN";
    default:
      return "ALLOW_RECOVERY_PATTERN";
  }
}

export async function runRecoverySimulation({
  request,
  tenantContext,
  securityContext,
  replayInputs = {},
  continuityInputs = {},
  approvalState = "approved",
}: {
  request: RecoverySimulationRequest;
  tenantContext: TenantContext;
  securityContext?: SecurityContext;
  replayInputs?: Record<string, unknown>;
  continuityInputs?: Record<string, unknown>;
  approvalState?: "approved" | "missing" | "expired";
}): Promise<RecoverySimulationResult> {
  const timestamp = request.createdAt;
  const auditEntries = appendRecoverySimulationAuditTrail({
    simulationId: request.simulationId,
    executionId: request.executionId,
    tenantId: tenantContext.tenantId,
    workspaceId: tenantContext.workspaceId,
    events: [{ type: "simulation.started" }],
  });

  const constraints = validateRecoverySimulationConstraints(request);
  if (!constraints.ok) {
    const blockedAudit = appendRecoverySimulationAuditTrail({
      simulationId: request.simulationId,
      executionId: request.executionId,
      tenantId: tenantContext.tenantId,
      workspaceId: tenantContext.workspaceId,
      events: [{ type: "simulation.blocked", payload: { reason: constraints.error.code } }],
    });
    return {
      simulationId: request.simulationId,
      executionId: request.executionId,
      scenarioType: request.scenarioType,
      state: "BLOCKED",
      outcome: "SIMULATION_FAILED",
      dryRun: true,
      productionMutationAllowed: false,
      replayDeterministic: false,
      continuityValidated: false,
      governanceValidated: false,
      divergenceDetected: false,
      survivabilityScore: 0,
      confidence: 0,
      evidenceIds: [],
      auditEventIds: [...auditEntries, ...blockedAudit].map((entry) => String(entry.id)),
      warnings: [],
      disputes: [],
      errors: [constraints.error.code],
      recommendedAction: "BLOCK_RECOVERY_PATTERN",
      timestamp,
    };
  }

  const scenario = getRecoverySimulationScenario(request.scenarioType);
  const constraintAudit = appendRecoverySimulationAuditTrail({
    simulationId: request.simulationId,
    executionId: request.executionId,
    tenantId: tenantContext.tenantId,
    workspaceId: tenantContext.workspaceId,
    events: [
      { type: "simulation.constraints.validated" },
      { type: "simulation.scenario.resolved", payload: { scenarioType: scenario.type } },
    ],
  });

  const replay = await runRecoverySimulationReplayAdapter({
    executionId: request.executionId,
    scenarioType: request.scenarioType,
    tenantContext,
    replayInputs,
  });
  const replayAudit = appendRecoverySimulationAuditTrail({
    simulationId: request.simulationId,
    executionId: request.executionId,
    tenantId: tenantContext.tenantId,
    workspaceId: tenantContext.workspaceId,
    events: [{ type: "simulation.replay.validated", payload: { divergenceDetected: replay.divergenceDetected } }],
  });

  const replayResult = replay.replayVerification.ok
    ? replay.replayVerification.data.reconstruction
    : {
        deterministic: false,
        reconstructedStates: [],
        replaySequence: [],
      };
  const continuity = validateRecoverySimulationContinuity({
    scenarioType: request.scenarioType,
    replayDeterministic: replay.replayDeterministic,
    continuitySnapshots: (replayInputs.continuitySnapshots as Record<string, unknown>[] | undefined) || replay.evidence.continuitySnapshots,
    ledgerEvents: (replayInputs.ledgerEvents as Record<string, unknown>[] | undefined) || replay.evidence.ledgerEvents,
    checkpointState: (continuityInputs.checkpointState as string | undefined)
      || String((replay.evidence.executionState?.execution?.status || replay.evidence.executionState?.checkpoint?.status || "")),
    replayResult,
  });
  const continuityAudit = appendRecoverySimulationAuditTrail({
    simulationId: request.simulationId,
    executionId: request.executionId,
    tenantId: tenantContext.tenantId,
    workspaceId: tenantContext.workspaceId,
    events: [{ type: "simulation.continuity.validated", payload: { validated: continuity.validated } }],
  });

  const governance = await validateRecoverySimulationGovernance({
    executionId: request.executionId,
    scenarioType: request.scenarioType,
    tenantContext,
    securityContext,
    replayValidation: replay.replayVerification,
    approvalState,
  });
  const governanceAudit = appendRecoverySimulationAuditTrail({
    simulationId: request.simulationId,
    executionId: request.executionId,
    tenantId: tenantContext.tenantId,
    workspaceId: tenantContext.workspaceId,
    events: [{ type: "simulation.governance.validated", payload: { ok: governance.ok } }],
  });

  const outcome = decideOutcome({
    replay,
    continuity,
    governanceOk: governance.ok,
  });
  const evidence = buildRecoverySimulationEvidence({
    request,
    scenario,
    replay,
    continuity,
    governance: governance.ok
      ? { ok: true, warnings: governance.warnings, disputes: governance.disputes }
      : { ok: false, warnings: governance.warnings, disputes: governance.disputes },
    outcome,
    timestamp,
  });
  const evidenceAudit = appendRecoverySimulationAuditTrail({
    simulationId: request.simulationId,
    executionId: request.executionId,
    tenantId: tenantContext.tenantId,
    workspaceId: tenantContext.workspaceId,
    events: [{ type: "simulation.evidence.generated", payload: { evidenceIds: evidence.evidenceIds } }],
  });

  const finalEventType =
    outcome === "RECOVERY_VALID" || outcome === "RECOVERY_VALID_WITH_WARNINGS"
      ? "simulation.completed"
      : outcome === "REPLAY_DIVERGENCE_DETECTED"
        ? "simulation.disputed"
        : outcome === "CONTAINMENT_REQUIRED"
          ? "simulation.contained"
          : outcome === "GOVERNANCE_BLOCKED"
            ? "simulation.blocked"
            : "simulation.failed";
  const finalAudit = appendRecoverySimulationAuditTrail({
    simulationId: request.simulationId,
    executionId: request.executionId,
    tenantId: tenantContext.tenantId,
    workspaceId: tenantContext.workspaceId,
    events: [{ type: finalEventType, payload: { outcome } }],
  });

  return {
    simulationId: request.simulationId,
    executionId: request.executionId,
    scenarioType: request.scenarioType,
    state:
      outcome === "RECOVERY_VALID" || outcome === "RECOVERY_VALID_WITH_WARNINGS"
        ? "COMPLETED"
        : outcome === "REPLAY_DIVERGENCE_DETECTED"
          ? "DISPUTED"
          : outcome === "CONTAINMENT_REQUIRED"
            ? "CONTAINED"
            : outcome === "GOVERNANCE_BLOCKED"
              ? "BLOCKED"
              : "FAILED",
    outcome,
    dryRun: true,
    productionMutationAllowed: false,
    replayDeterministic: replay.replayDeterministic,
    continuityValidated: continuity.validated,
    governanceValidated: governance.ok,
    divergenceDetected: replay.divergenceDetected,
    survivabilityScore: continuity.survivabilityScore,
    confidence: replay.confidence,
    evidenceIds: evidence.evidenceIds,
    auditEventIds: [
      ...auditEntries,
      ...constraintAudit,
      ...replayAudit,
      ...continuityAudit,
      ...governanceAudit,
      ...evidenceAudit,
      ...finalAudit,
    ].map((entry) => String(entry.id)),
    warnings: [...scenario.expectedWarnings, ...replay.warnings, ...continuity.warnings, ...governance.warnings],
    disputes: [...scenario.expectedDisputes, ...replay.disputes, ...continuity.disputes, ...governance.disputes],
    errors: governance.ok ? [] : [governance.error.code],
    recommendedAction: decideRecommendedAction(outcome),
    timestamp,
  };
}
