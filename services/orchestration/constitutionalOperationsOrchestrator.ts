import { arbitrateGovernanceResults } from "../governance/governanceArbitration";
import { evaluateConstitutionalGovernance } from "../governance/constitutionalGovernanceEngine";
import { buildGovernanceTelemetry } from "../governance/governanceTelemetry";
import { buildOperationalRoute } from "./operationalRouting";
import { buildOrchestrationAuditRecord } from "./orchestrationAudit";
import { evaluateOrchestrationPolicies } from "./orchestrationPolicies";
import { buildOrchestrationTelemetry } from "./orchestrationTelemetry";

export function runConstitutionalOperationsOrchestrator(input: {
  requestType: string;
  constitutionalAction?: string;
  constitutionalViolations?: string[];
  validation: {
    valid: boolean;
    freezeActivated?: boolean;
    containmentActivated?: boolean;
    operatorReviewRequired?: boolean;
    blockedReasons?: string[];
  };
  readiness: {
    readinessState?: string;
    readinessScore?: number;
    requiresOperatorApproval?: boolean;
    advisoryOnly?: boolean;
    liveAutonomyEnabled?: boolean;
  };
  escalationCoordination?: {
    frozen?: boolean;
    blocked?: boolean;
    conflictingEscalations?: string[];
    escalationLineageId?: string;
    requiresOperatorVisibility?: boolean;
    confidence?: number;
  };
  timestamp: string;
}) {
  const governance = evaluateConstitutionalGovernance({
    constitutionalAction: input.constitutionalAction,
    constitutionalViolations: input.constitutionalViolations,
    validation: input.validation,
    readiness: input.readiness,
    operatorApprovalVerified: input.readiness.requiresOperatorApproval === true,
  });

  const arbitration = arbitrateGovernanceResults([governance]);
  const route = buildOperationalRoute({
    requestType: input.requestType,
    constitutionalState: arbitration.constitutionalState,
    allowed: arbitration.allowed,
  });
  const policies = evaluateOrchestrationPolicies({
    allowed: arbitration.allowed,
    constitutionalState: arbitration.constitutionalState,
    validationValid: input.validation.valid,
    escalationLoopDetected: Boolean(input.escalationCoordination?.frozen && (input.escalationCoordination?.conflictingEscalations?.length || 0) > 0),
    containmentRequired: arbitration.containmentRequired,
  });

  const auditRecords = [
    buildOrchestrationAuditRecord({
      eventType: policies.authorized
        ? "orchestration.allowed"
        : arbitration.constitutionalState === "DENIED"
          ? "orchestration.denied"
          : policies.locked
            ? "orchestration.locked"
            : "orchestration.denied",
      requestType: input.requestType,
      constitutionalState: arbitration.constitutionalState,
      reasoning: [...arbitration.reasoning, ...policies.blockedReasons],
      timestamp: input.timestamp,
    }),
  ];

  const telemetry = [
    ...buildGovernanceTelemetry({
      governanceConfidence: arbitration.governanceConfidence,
      deniedOperations: policies.authorized ? 0 : 1,
      containmentTriggers: arbitration.containmentRequired ? 1 : 0,
      escalationTriggers: arbitration.escalationRequired ? 1 : 0,
      emergencyGovernanceActivations: arbitration.constitutionalState === "EMERGENCY_GOVERNANCE" ? 1 : 0,
      timestamp: input.timestamp,
    }),
    ...buildOrchestrationTelemetry({
      governanceConfidence: arbitration.governanceConfidence,
      deniedOperations: policies.authorized ? 0 : 1,
      escalationTriggers: arbitration.escalationRequired ? 1 : 0,
      containmentTriggers: arbitration.containmentRequired ? 1 : 0,
      arbitrationOutcome: policies.authorized ? 1 : 0.2,
      supervisionConfidence: arbitration.governanceConfidence,
      timestamp: input.timestamp,
    }),
  ];

  return {
    ...arbitration,
    orchestrationAuthorized: policies.authorized,
    locked: policies.locked,
    route,
    auditRecords,
    telemetry,
  };
}
