import type {
  DecisionIntentArtifact,
  DecisionIntentBoundaryError,
  DecisionIntentBoundaryInput,
  DecisionIntentBoundaryResult,
  IntentLineageEntry,
} from "./decisionIntentStateTypes";
import { validateDecisionIntentInput } from "./decisionIntentSchemas";
import { detectExecutionSemantics } from "./executionSemanticsDetector";
import { detectRuntimeBindings } from "./runtimeBindingDetector";
import { detectSchedulerSemantics } from "./schedulerSemanticsDetector";
import { detectOrchestrationSemantics } from "./orchestrationSemanticsDetector";
import { detectHiddenExecutionIntent } from "./hiddenExecutionIntentDetector";
import { detectImplicitDispatch } from "./implicitDispatchDetector";
import { detectCapabilityMutation } from "./capabilityMutationDetector";
import { detectAuthorityExpansionIntent } from "./authorityExpansionIntentDetector";
import { enforceIntentCapabilityFirewall } from "./intentCapabilityFirewall";
import { validateIntentIsolationBoundary } from "./intentIsolationBoundary";
import { validateIntentContainmentBoundary } from "./intentContainmentBoundary";
import { blockIntentExecution } from "./intentExecutionBlocker";
import { validateIntentAuthorityFirewall } from "./intentAuthorityFirewall";
import { validateBoundedPlanning } from "./boundedPlanningValidator";
import { scoreIntentProposal } from "./proposalScoringEngine";
import { estimateIntentConfidence } from "./confidenceEstimationEngine";
import { interpretIntentRisk } from "./riskInterpretationEngine";
import { buildDecisionRecommendation } from "./decisionRecommendationEngine";
import { validateIntentReplay } from "./intentReplayValidator";
import { validateHistoricalIntentReplay } from "./historicalIntentReplayValidator";
import { verifyIntentLineage } from "./intentLineageVerifier";
import { validateIntentDeterminism } from "./intentDeterminismValidator";
import { validateIntentGovernance } from "./governanceIntentValidator";
import { validateApprovalDependencies } from "./approvalDependencyValidator";
import { validateOperatorOversight } from "./operatorOversightValidator";
import { validateAdvisoryOnlyArtifact } from "./advisoryOnlyValidator";
import { validateIntentDrift } from "./intentDriftValidator";
import { detectSemanticDrift } from "./semanticDriftDetector";
import { validateIntentContainment } from "./intentContainmentValidator";
import { validateIntentGovernanceBinding } from "./intentGovernanceBindingValidator";
import { validateIntentReplayBinding } from "./intentReplayBindingValidator";
import { buildDecisionIntentPolicy } from "./decisionIntentPolicyEngine";
import { aggregateIntentBoundary } from "./decisionIntentAggregator";
import { generateIntentEvidence } from "./decisionIntentEvidenceGenerator";
import { appendIntentLedger, appendIntentLineage } from "./immutableIntentLineageLog";
import { hashIntentValue } from "./intentTraceHasher";

function makeErrorList(items: readonly DecisionIntentBoundaryError[]): readonly DecisionIntentBoundaryError[] {
  return Object.freeze([...items]);
}

export function buildDecisionIntentBoundary(
  input: DecisionIntentBoundaryInput,
): DecisionIntentBoundaryResult {
  const schemaErrors = validateDecisionIntentInput(input);
  const executionSemantics = detectExecutionSemantics(input);
  const runtimeBindings = detectRuntimeBindings(input);
  const schedulerSemantics = detectSchedulerSemantics(input);
  const orchestrationSemantics = detectOrchestrationSemantics(input);
  const hiddenExecutionIntent = detectHiddenExecutionIntent(input);
  const implicitDispatch = detectImplicitDispatch(input);
  const capabilityMutation = detectCapabilityMutation(input);
  const authorityExpansionIntent = detectAuthorityExpansionIntent(input);

  const executionErrors = blockIntentExecution({
    executionSemantics,
    hiddenExecutionIntent,
    implicitDispatch,
  });
  const capabilityErrors = enforceIntentCapabilityFirewall({
    capabilityMutation,
    authorityExpansion: authorityExpansionIntent,
  });
  const isolationErrors = validateIntentIsolationBoundary(input);
  const containmentBoundaryErrors = validateIntentContainmentBoundary(input);
  const authorityFirewallErrors = validateIntentAuthorityFirewall(input);
  const boundedPlanningErrors = validateBoundedPlanning(input);
  const replayErrors = validateIntentReplay(input);
  const historicalReplayErrors = validateHistoricalIntentReplay(input);
  const lineageErrors = verifyIntentLineage(input);
  const governanceErrors = validateIntentGovernance(input);
  const approvalErrors = validateApprovalDependencies(input);
  const oversightErrors = validateOperatorOversight(input);
  const driftErrors = validateIntentDrift(input);
  const semanticDriftErrors = detectSemanticDrift(input);
  const containmentErrors = validateIntentContainment(input);
  const governanceBindingErrors = validateIntentGovernanceBinding(input);
  const replayBindingErrors = validateIntentReplayBinding(input);

  const preArtifactErrors = makeErrorList([
    ...schemaErrors,
    ...(runtimeBindings.triggered ? [{
      code: "DECISION_INTENT_RUNTIME_BINDING" as const,
      message: "Runtime binding semantics are forbidden in decision intent.",
      path: "summary",
    }] : []),
    ...(schedulerSemantics.triggered ? [{
      code: "DECISION_INTENT_SCHEDULER_SEMANTICS" as const,
      message: "Scheduler semantics are forbidden in decision intent.",
      path: "summary",
    }] : []),
    ...(orchestrationSemantics.triggered ? [{
      code: "DECISION_INTENT_ORCHESTRATION_SEMANTICS" as const,
      message: "Orchestration semantics are forbidden in decision intent.",
      path: "summary",
    }] : []),
    ...(hiddenExecutionIntent.triggered ? [{
      code: "DECISION_INTENT_HIDDEN_EXECUTION" as const,
      message: "Hidden execution language was detected.",
      path: "summary",
    }] : []),
    ...(implicitDispatch.triggered ? [{
      code: "DECISION_INTENT_IMPLICIT_DISPATCH" as const,
      message: "Implicit dispatch language was detected.",
      path: "summary",
    }] : []),
    ...executionErrors,
    ...capabilityErrors,
    ...isolationErrors,
    ...containmentBoundaryErrors,
    ...authorityFirewallErrors,
    ...boundedPlanningErrors,
    ...replayErrors,
    ...historicalReplayErrors,
    ...lineageErrors,
    ...governanceErrors,
    ...approvalErrors,
    ...oversightErrors,
    ...driftErrors,
    ...semanticDriftErrors,
    ...containmentErrors,
    ...governanceBindingErrors,
    ...replayBindingErrors,
  ]);

  const proposalScore = scoreIntentProposal(input);
  const confidence = estimateIntentConfidence({
    intentInput: input,
    proposalScore,
    errors: preArtifactErrors,
  });
  const risk = interpretIntentRisk(preArtifactErrors);
  const failClosed = preArtifactErrors.length > 0;
  const policy = buildDecisionIntentPolicy();
  const aggregation = aggregateIntentBoundary({
    proposalScore,
    confidenceScore: confidence.score,
    riskLevel: risk.level,
    failClosed,
  });

  const artifact: DecisionIntentArtifact = Object.freeze({
    intentId: input.intentId,
    schemaVersion: input.schemaVersion,
    intentType: input.intentType,
    advisoryOnly: true as const,
    executable: false as const,
    executionAuthorized: false as const,
    orchestrationAllowed: false as const,
    runtimeMutationAllowed: false as const,
    authorityMutationAllowed: false as const,
    governanceMutationAllowed: false as const,
    schedulerRegistrationAllowed: false as const,
    operatorReviewRequired: true as const,
    summary: buildDecisionRecommendation({
      intentInput: input,
      riskLevel: risk.level,
      proposalScore,
    }),
    evidenceLineage: input.evidenceLineage,
    governanceLineage: input.governanceLineage,
    proposalLineage: input.proposalLineage,
    replayLineage: input.replayLineage,
    approvalDependencies: input.approvalDependencies,
    risk,
    confidence,
    constitutionalBoundaryState: Object.freeze({
      containsExecutionSemantics: false as const,
      containsRuntimeBindings: false as const,
      containsSchedulerBindings: false as const,
      containsOrchestrationBindings: false as const,
      containsAuthorityExpansion: false as const,
      containsCapabilityMutation: false as const,
      containsHiddenDispatch: false as const,
      containmentVerified: !failClosed,
    }),
    deterministicHash: hashIntentValue("decision-intent-artifact", {
      intentId: input.intentId,
      intentType: input.intentType,
      proposalScore,
      confidence,
      risk,
      failClosed,
    }),
    createdAt: input.createdAt,
  });

  const advisoryErrors = validateAdvisoryOnlyArtifact(artifact);
  const errors = makeErrorList([
    ...preArtifactErrors,
    ...advisoryErrors,
  ]);

  const evidence = generateIntentEvidence({
    intentInput: input,
    reasons: Object.freeze(errors.map((error) => error.code)),
  });
  const lineageEntry: IntentLineageEntry = Object.freeze({
    entryId: hashIntentValue("decision-intent-lineage-entry-id", {
      intentId: input.intentId,
      createdAt: input.createdAt,
    }),
    intentId: input.intentId,
    coordinationId: input.constitutionalReadinessResult.record.coordinationId,
    intentType: input.intentType,
    failClosed,
    createdAt: input.createdAt,
    deterministicHash: hashIntentValue("decision-intent-lineage-entry", {
      intentId: input.intentId,
      intentType: input.intentType,
      failClosed,
      evidenceHash: evidence.evidenceHash,
    }),
  });
  const lineage = appendIntentLineage({
    existing: input.existingLineage,
    entry: lineageEntry,
  });
  const replayLedger = appendIntentLedger({
    existing: appendIntentLedger({
      existing: input.existingReplayLedger,
      payload: Object.freeze({
        event: "decision.intent.evaluated",
        intentId: input.intentId,
        intentType: input.intentType,
        failClosed,
        evidenceHash: evidence.evidenceHash,
        lineageHash: lineage.lineageHash,
      }),
      scope: "decision-intent-boundary",
    }),
    payload: Object.freeze({
      event: failClosed ? "decision.intent.failed_closed" : "decision.intent.advisory_certified",
      intentId: input.intentId,
      deterministicHash: artifact.deterministicHash,
      riskLevel: risk.level,
    }),
    scope: "decision-intent-boundary-audit",
  });

  const determinismErrors = validateIntentDeterminism({
    intentInput: input,
    scans: [
      executionSemantics,
      runtimeBindings,
      schedulerSemantics,
      orchestrationSemantics,
      hiddenExecutionIntent,
      implicitDispatch,
      capabilityMutation,
      authorityExpansionIntent,
    ],
  });

  const finalErrors = makeErrorList([
    ...errors,
    ...determinismErrors,
  ]);

  const result: DecisionIntentBoundaryResult = Object.freeze({
    artifact,
    policy,
    aggregation,
    executionSemantics,
    runtimeBindings,
    schedulerSemantics,
    orchestrationSemantics,
    hiddenExecutionIntent,
    implicitDispatch,
    capabilityMutation,
    authorityExpansionIntent,
    evidence,
    lineage,
    replayLedger,
    warnings: Object.freeze(failClosed
      ? ["Decision intent failed closed and preserved operator review under uncertainty."]
      : ["Decision intent remained bounded, advisory-only, and non-executable."]),
    errors: finalErrors,
    deterministicHash: hashIntentValue("decision-intent-boundary-result", {
      intentId: input.intentId,
      artifactHash: artifact.deterministicHash,
      evidenceHash: evidence.evidenceHash,
      lineageHash: lineage.lineageHash,
      policyHash: policy.deterministicHash,
      aggregationHash: aggregation.deterministicHash,
      errorCodes: finalErrors.map((error) => error.code),
    }),
    derivedOnly: true as const,
  });
  return result;
}
