import { validateSequentialDependencies } from "../dependencies";
import { hashPayloadDeterministically } from "@/services/contracts/payloadHasher";
import { buildAutonomyEnvelope } from "./autonomy-envelope-builder";
import { scoreRiskDeterministically } from "./deterministic-risk-scorer";
import { createExecutionTruthError } from "./execution-truth-errors";
import { hashExecutionTruth } from "./execution-truth-hasher";
import { buildGovernanceEnvelope } from "./governance-envelope-builder";
import { extractRiskSignals } from "./risk-signal-extractor";
import { freezeExecutionTruthPackage } from "./execution-truth-report";
import { analyzeRollbackExposure } from "./rollback-exposure-analyzer";
import { propagateTopologyRisk } from "./topology-risk-propagator";
import type { ExecutionTruthBuildInput, ExecutionTruthResult, ReplayEnvelope } from "./execution-truth-types";
import type { NormalizedPlan } from "../normalization";

function isNormalizedPlan(value: unknown): value is NormalizedPlan {
  return Boolean(
    value
    && typeof value === "object"
    && typeof (value as { normalizationVersion?: unknown }).normalizationVersion === "string"
    && Array.isArray((value as { steps?: unknown }).steps),
  );
}

export function validateExecutionTruth(input: ExecutionTruthBuildInput | { normalizedPlan: NormalizedPlan } | NormalizedPlan): ExecutionTruthResult {
  const normalizedPlan = isNormalizedPlan(input) ? input : input.normalizedPlan;
  if (!normalizedPlan) {
    return {
      ok: false,
      error: createExecutionTruthError(
        "PHASE_4_2E_DEPENDENCY_ARTIFACT_MISSING",
        "Execution truth validation requires a normalized 4.2C plan.",
      ),
    };
  }

  const dependencyValidation = "dependencyValidation" in (input as ExecutionTruthBuildInput)
    ? (input as ExecutionTruthBuildInput).dependencyValidation ?? validateSequentialDependencies(normalizedPlan)
    : validateSequentialDependencies(normalizedPlan);

  if (!dependencyValidation.ok || !dependencyValidation.dependencyGraphFingerprint) {
    return {
      ok: false,
      error: createExecutionTruthError(
        "PHASE_4_2E_DEPENDENCY_VALIDATION_FAILED",
        "Execution truth validation requires a successful 4.2D dependency validation artifact.",
      ),
      dependencyValidation,
    };
  }

  const signals = extractRiskSignals(normalizedPlan);
  if (!signals.ok) {
    return {
      ok: false,
      error: signals.error,
      dependencyValidation,
    };
  }

  const scored = scoreRiskDeterministically(signals.stepSignals);
  const propagated = propagateTopologyRisk(scored, dependencyValidation);
  const rollbackAware = analyzeRollbackExposure(propagated);
  const governanceEnvelope = buildGovernanceEnvelope(rollbackAware, dependencyValidation);
  const autonomyEnvelope = buildAutonomyEnvelope(rollbackAware, governanceEnvelope);

  if (!governanceEnvelope.allowed && rollbackAware.overallRisk === "R6_FORBIDDEN") {
    return {
      ok: false,
      error: createExecutionTruthError(
        "PHASE_4_2E_FORBIDDEN_RISK",
        "Forbidden risk blocked execution truth authorization.",
      ),
      dependencyValidation,
    };
  }

  if (rollbackAware.failClosed && rollbackAware.overallRisk !== "R6_FORBIDDEN") {
    return {
      ok: false,
      error: createExecutionTruthError(
        "PHASE_4_2E_UNKNOWN_RISK_FAIL_CLOSED",
        "Unknown or unstable risk state forced fail-closed behavior.",
      ),
      dependencyValidation,
    };
  }

  if (!governanceEnvelope.allowed) {
    return {
      ok: false,
      error: createExecutionTruthError(
        "PHASE_4_2E_GOVERNANCE_BLOCKED",
        "Governance envelope blocked execution truth authorization.",
        { blockedReasons: governanceEnvelope.blockedReasons },
      ),
      dependencyValidation,
    };
  }

  const replayEnvelope: ReplayEnvelope = {
    replayable: true,
    sourceFingerprint: dependencyValidation.dependencyGraphFingerprint,
    replayHash: hashPayloadDeterministically({
      dependencyGraphFingerprint: dependencyValidation.dependencyGraphFingerprint,
      normalizationHash: normalizedPlan.normalizationHash,
      replayHash: normalizedPlan.replayHash,
      validationHash: normalizedPlan.validationHash,
    }),
  };

  const executionTruthHash = hashExecutionTruth({
    dependencyGraphFingerprint: dependencyValidation.dependencyGraphFingerprint,
    riskProfile: rollbackAware,
    governanceEnvelope,
    autonomyEnvelope,
    replayEnvelope,
  });

  const executionTruthPackage = freezeExecutionTruthPackage({
    planId: normalizedPlan.planId,
    dependencyGraphFingerprint: dependencyValidation.dependencyGraphFingerprint,
    riskProfile: rollbackAware,
    governanceEnvelope,
    autonomyEnvelope,
    replayEnvelope,
    executionTruthHash,
    authorized: governanceEnvelope.allowed,
  });

  return {
    ok: true,
    dependencyValidation,
    executionTruthPackage,
  };
}
