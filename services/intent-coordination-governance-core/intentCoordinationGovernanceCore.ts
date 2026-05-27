import type {
  CoordinationBoundaryContract,
  CoordinationGovernanceError,
  CoordinationLineageLedger,
  CoordinationState,
  CoordinationTransition,
  IntentCoordinationGovernanceRecord,
  IntentCoordinationTopology,
} from "@/types/intent-coordination-governance-core";
import type { ConstitutionalGovernanceView } from "@/types/constitutional-governance";
import type { ProposalRecord } from "@/types/proposal-lifecycle-engine";
import type { BoundedCoordinationFrameworkRecord } from "@/types/bounded-coordination-framework";
import type { ConstitutionalEscalationRecord } from "@/services/constitutional-escalation-layer";
import type { ReplayReconstructionResult } from "@/types/replay-reconstruction-engine";
import type { ConstitutionalAutonomyReadinessGateRecord } from "./constitutionalAutonomyReadinessGateAdapter";
import { guardIntentCoordinationInput } from "./coordinationGuards";
import { buildCoordinationGovernanceSchema } from "./coordinationGovernanceSchema";
import { validateCoordinationTopologySchema, validateCoordinationTransitionValue, validateIntentCoordinationNode } from "./coordinationSchemas";
import { validateCoordinationBoundaries } from "./coordinationBoundaryValidator";
import { validateCoordinationRelationships } from "./coordinationRelationshipValidator";
import { validateCoordinationDependencies } from "./coordinationDependencyValidator";
import { validateCoordinationLifecycle } from "./coordinationLifecycleValidator";
import { validateIntentCoordinationTopology } from "./coordinationTopologyValidator";
import { bindCoordinationReadiness } from "./coordinationReadinessBinder";
import { deriveEscalationGovernanceModel } from "./escalationGovernanceModel";
import { validateEscalationContainment } from "./escalationContainmentValidator";
import { inspectCoordinationContainment } from "./coordinationContainmentInspector";
import { bindCoordinationReplay } from "./coordinationReplayBinder";
import { validateCoordinationReplayBinding } from "./coordinationReplayValidator";
import { buildCoordinationAuditEvents } from "./coordinationAuditEvents";
import { appendCoordinationGovernanceLineage } from "./coordinationLineageLedger";
import { detectCoordinationDrift } from "./coordinationDriftDetector";
import { hashCoordinationGovernanceValue } from "./coordinationHasher";

export type IntentCoordinationGovernanceInput = Readonly<{
  coordinationId: string;
  currentState: CoordinationState;
  requestedTransition: CoordinationTransition;
  governanceView: ConstitutionalGovernanceView;
  readinessGate: ConstitutionalAutonomyReadinessGateRecord;
  proposal: ProposalRecord;
  boundedCoordination: BoundedCoordinationFrameworkRecord;
  escalation: ConstitutionalEscalationRecord;
  replay: ReplayReconstructionResult;
  topology: IntentCoordinationTopology;
  boundaryContract: CoordinationBoundaryContract;
  createdAt: string;
  existingLineage?: CoordinationLineageLedger;
  metadata?: Readonly<Record<string, unknown>>;
}>;

export function buildIntentCoordinationGovernanceRecord(
  input: IntentCoordinationGovernanceInput,
): IntentCoordinationGovernanceRecord {
  const topologyHash = hashCoordinationGovernanceValue("intent-coordination-topology", {
    rootIntentId: input.topology.rootIntentId,
    nodes: input.topology.nodes,
    relationships: input.topology.relationships,
  });
  const schemaErrors = [
    ...validateCoordinationTopologySchema(input.topology),
    ...validateCoordinationTransitionValue(input.requestedTransition),
    ...input.topology.nodes.flatMap((node) => validateIntentCoordinationNode(node)),
  ];
  const guardErrors = guardIntentCoordinationInput({
    governanceView: input.governanceView,
    metadata: input.metadata,
  });
  const boundaryErrors = validateCoordinationBoundaries(input.boundaryContract);
  const relationshipErrors = validateCoordinationRelationships(input.topology);
  const dependencyErrors = validateCoordinationDependencies(input.topology);
  const readinessBinding = bindCoordinationReadiness(input.readinessGate);
  const lifecycle = validateCoordinationLifecycle({
    currentState: input.currentState,
    requestedTransition: input.requestedTransition,
    escalationActive: input.escalation.recommendation.severity !== "E0",
    errorsPresent: [...schemaErrors, ...guardErrors, ...boundaryErrors, ...relationshipErrors, ...dependencyErrors].length > 0,
  });
  const topologyResult = validateIntentCoordinationTopology({
    topology: input.topology,
    boundaryContract: input.boundaryContract,
  });
  const escalationGovernance = deriveEscalationGovernanceModel({
    escalation: input.escalation,
    boundaryContract: input.boundaryContract,
    createdAt: input.createdAt,
  });
  const escalationErrors = validateEscalationContainment({
    escalationGovernance,
    escalation: input.escalation,
  });
  const preliminaryReplayValid =
    input.readinessGate.replayBinding.valid
    && input.proposal.replayBinding.valid
    && input.escalation.replayBinding.valid
    && input.replay.integrity.valid;
  const containmentResult = inspectCoordinationContainment({
    boundaryContract: input.boundaryContract,
    topologyStats: topologyResult.stats,
    replayValid: preliminaryReplayValid,
    lifecycleValid: lifecycle.errors.length === 0,
    createdAt: input.createdAt,
  });
  const replayResult = bindCoordinationReplay({
    governanceView: input.governanceView,
    readinessGate: input.readinessGate,
    proposal: input.proposal,
    escalation: input.escalation,
    replay: input.replay,
    topology: Object.freeze({
      ...input.topology,
      topologyHash,
    }),
    containment: containmentResult.containment,
    lifecycleState: lifecycle.resultingState,
  });
  const replayErrors = validateCoordinationReplayBinding(replayResult.replayBinding);
  const driftErrors = detectCoordinationDrift({
    topology: input.topology,
    proposal: input.proposal,
  });

  const governanceSchema = buildCoordinationGovernanceSchema({
    governanceView: input.governanceView,
    readinessGate: input.readinessGate,
    createdAt: input.createdAt,
  });

  const reasons = Object.freeze([
    ...readinessBinding.reasons,
    ...(topologyResult.errors.length === 0 ? ["Coordination topology satisfies bounded constitutional structure."] : ["Coordination topology contains constitutional violations."]),
    ...(containmentResult.errors.length === 0 ? containmentResult.containment.reasons : ["Containment validation failed."]),
    ...(replayErrors.length === 0 ? ["Coordination replay binding is deterministic and valid."] : ["Coordination replay binding is invalid or disputed."]),
  ]);

  const validation = Object.freeze({
    validationId: hashCoordinationGovernanceValue("intent-coordination-validation-id", {
      coordinationId: input.coordinationId,
      createdAt: input.createdAt,
    }),
    currentState: input.currentState,
    requestedTransition: input.requestedTransition,
    resultingState: lifecycle.resultingState,
    lifecycleValid: lifecycle.errors.length === 0,
    topologyValid: topologyResult.errors.length === 0,
    replayValid: replayErrors.length === 0 && replayResult.errors.length === 0,
    governanceValid: input.governanceView.state !== "DENY" && input.governanceView.policy.unknownAuthorityDisposition === "DENY",
    readinessValid: readinessBinding.errors.length === 0,
    escalationValid: escalationErrors.length === 0,
    containmentValid: containmentResult.errors.length === 0,
    executionLeakAbsent: guardErrors.length === 0,
    reasons,
    createdAt: input.createdAt,
  });

  const provisionalCoordinationHash = hashCoordinationGovernanceValue("intent-coordination-provisional", {
    topology: input.topology,
    governanceSchema,
    validation,
    replayBinding: replayResult.replayBinding,
  });
  const lineageHash = hashCoordinationGovernanceValue("intent-coordination-lineage-hash", {
    readinessHash: input.readinessGate.readinessHash,
    escalationHash: input.escalation.escalationHash,
    proposalHash: input.proposal.proposalHash,
    topologyHash,
    provisionalCoordinationHash,
  });
  const lineage = appendCoordinationGovernanceLineage({
    existing: input.existingLineage,
    coordinationId: input.coordinationId,
    coordinationHash: provisionalCoordinationHash,
    replayHash: replayResult.replayBinding.reconstructionHash,
    lineageHash,
    createdAt: input.createdAt,
  });
  const auditEvents = buildCoordinationAuditEvents({
    coordinationId: input.coordinationId,
    createdAt: input.createdAt,
    replayHash: replayResult.replayBinding.reconstructionHash,
    topologyHash: input.topology.topologyHash,
    resultingState: lifecycle.resultingState,
  });

  const errors: CoordinationGovernanceError[] = [
    ...schemaErrors,
    ...guardErrors,
    ...boundaryErrors,
    ...relationshipErrors,
    ...dependencyErrors,
    ...readinessBinding.errors,
    ...lifecycle.errors,
    ...topologyResult.errors,
    ...escalationErrors,
    ...containmentResult.errors,
    ...replayResult.errors,
    ...replayErrors,
    ...driftErrors,
  ];

  const coordinationHash = hashCoordinationGovernanceValue("intent-coordination-governance-record", {
    coordinationId: input.coordinationId,
    state: lifecycle.resultingState,
    topology: input.topology,
    governanceSchema,
    boundaryContract: input.boundaryContract,
    escalationGovernance,
    containment: containmentResult.containment,
    validation,
    replayBinding: replayResult.replayBinding,
    lineage,
    auditEvents,
    errors,
  });

  return Object.freeze({
    coordinationId: input.coordinationId,
    state: lifecycle.resultingState,
    governanceSchema,
    topology: Object.freeze({
      ...input.topology,
      topologyHash,
      lineageHash,
      derivedOnly: true,
    }),
    boundaryContract: input.boundaryContract,
    escalationGovernance,
    containment: containmentResult.containment,
    validation,
    replayBinding: replayResult.replayBinding,
    lineage,
    auditEvents,
    warnings: Object.freeze([
      ...input.proposal.warnings,
      ...input.readinessGate.warnings,
      ...input.escalation.warnings,
      ...input.boundedCoordination.warnings,
      "Intent coordination governance remains declarative and non-executing.",
    ]),
    errors: Object.freeze(errors),
    coordinationHash,
    derivedOnly: true,
  });
}
