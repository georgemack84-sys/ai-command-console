import { hashEvidence } from "@/services/audit/evidenceHashing";
import type { GovernanceValidationInput, PlanValidationResult } from "@/services/validation/validationContracts";
import { appendPlanAudit } from "./planAudit";
import type { PersistedPlan, PersistedPlanState, PersistedPlanStep, PlanLifecycleEvent } from "./planContracts";
import { PLAN_ERROR_CODES } from "./planContracts";
import { appendStoredLifecycleEvent, appendStoredPlanStep, readLifecycleEvents, readPlan, readPlanSteps, readValidationBinding, writePlan, writeValidationBinding } from "./planStore";
import { capturePlanValidationSnapshot } from "./planValidationSnapshot";

function clone<T>(value: T) : T {
  return JSON.parse(JSON.stringify(value));
}

function buildIntegrity(input: {
  planId: string;
  lifecycleState: PersistedPlanState;
  steps: PersistedPlanStep[];
  planHash?: string;
  governanceDecisionHash?: string;
  lifecycleEvents?: PlanLifecycleEvent[];
}) {
  const immutableHash = hashEvidence({
    planId: input.planId,
    lifecycleState: input.lifecycleState,
    steps: input.steps,
    planHash: input.planHash ?? null,
    governanceDecisionHash: input.governanceDecisionHash ?? null,
  });
  const replayHash = hashEvidence({
    planId: input.planId,
    lifecycleState: input.lifecycleState,
    stepCount: input.steps.length,
    planHash: input.planHash ?? null,
  });
  const lifecycleHash = hashEvidence({
    planId: input.planId,
    lifecycleEvents: input.lifecycleEvents ?? [],
  });
  return {
    immutableHash,
    replayHash,
    lifecycleHash,
  };
}

type CreatePlanInput = Partial<PersistedPlan> & Pick<PersistedPlan, "planId" | "schemaVersion" | "intent" | "source"> & {
  createdBy: string;
  createdAt?: number;
  updatedAt?: number;
};

function normalizePlan(planInput: CreatePlanInput) {
  const createdAt = planInput.createdAt ?? 0;
  const lifecycleState = (planInput.lifecycleState ?? planInput.state ?? "DRAFT") as PersistedPlanState;
  const steps = clone(planInput.steps ?? []);
  const riskLevel = planInput.riskLevel ?? "low";
  const approvalRequired = planInput.approvals?.approvalRequired ?? planInput.approvalRequired ?? false;
  const approvalApproved = planInput.approvals?.approved ?? (planInput.approvalState === "APPROVED");
  const cancellationRequested = planInput.cancellationRequested ?? false;
  const approvalState =
    planInput.approvalState
      ?? (approvalRequired ? (approvalApproved ? "APPROVED" : "PENDING") : "NONE");
  const planHash = planInput.planHash ?? planInput.validation?.validationHash;
  const governanceDecisionHash = planInput.governanceDecisionHash ?? planInput.validation?.governanceHash;
  const validatorVersion = planInput.validatorVersion ?? planInput.validation?.validatorVersion ?? "validator-unversioned";
  const registryVersion = planInput.registryVersion ?? planInput.validation?.registryVersion ?? "registry-unversioned";
  const governanceVersion = planInput.governanceVersion ?? planInput.validation?.governanceVersion ?? "governance-unversioned";
  const validationSnapshotId = planInput.validationSnapshotId ?? planInput.validation?.validationSnapshotId;
  const validationPassed = planInput.validationPassed ?? planInput.validation?.valid ?? false;
  const executionBlocked = planInput.executionBlocked ?? !(planInput.validation?.executionEligible ?? false);
  const integrity = buildIntegrity({
    planId: planInput.planId,
    lifecycleState,
    steps,
    planHash,
    governanceDecisionHash,
  });

  const plan: PersistedPlan = {
    ...clone(planInput),
    lifecycleState,
    state: lifecycleState,
    steps,
    validation: {
      validationSnapshotId: validationSnapshotId ?? "",
      validationHash: planHash ?? "",
      governanceHash: governanceDecisionHash ?? "",
      validatorVersion,
      registryVersion,
      governanceVersion,
      valid: validationPassed,
      executionEligible: !executionBlocked,
      validatedAt: planInput.validation?.validatedAt ?? 0,
    },
    approvals: {
      approvalRequired,
      approved: approvalApproved,
      approvedBy: planInput.approvals?.approvedBy,
      approvedAt: planInput.approvals?.approvedAt,
    },
    metadata: {
      createdAt,
      updatedAt: planInput.updatedAt ?? createdAt,
      plannerVersion: planInput.metadata?.plannerVersion ?? "planner-unversioned",
      source: planInput.metadata?.source ?? planInput.source,
    },
    lineage: {
      parentPlanId: planInput.lineage?.parentPlanId,
      replayOf: planInput.lineage?.replayOf,
      derivedFrom: planInput.lineage?.derivedFrom,
    },
    integrity,
    createdAt,
    updatedAt: planInput.updatedAt ?? createdAt,
    validationPassed,
    validationSnapshotId,
    planHash,
    governanceDecisionHash,
    approvalRequired,
    approvalState,
    riskLevel,
    executionBlocked,
    cancellationRequested,
    validatorVersion,
    registryVersion,
    governanceVersion,
  };
  return plan;
}

export function createPlan(planInput: CreatePlanInput) {
  if (readPlan(planInput.planId)) {
    throw new Error(PLAN_ERROR_CODES.PLAN_ALREADY_EXISTS);
  }
  const plan = normalizePlan(planInput);
  writePlan(plan);
  appendPlanAudit({
    planId: plan.planId,
    eventType: "plan.created",
    details: {
      state: plan.lifecycleState,
      source: plan.source,
      createdBy: plan.createdBy,
    },
  });
  return plan;
}

export function getPlan(planId: string) {
  const plan = readPlan(planId);
  if (!plan) {
    throw new Error(PLAN_ERROR_CODES.PLAN_NOT_FOUND);
  }
  return plan;
}

export function listPlanSteps(planId: string) {
  getPlan(planId);
  return readPlanSteps(planId);
}

export function appendPlanStep(step: PersistedPlanStep) {
  const plan = getPlan(step.planId);
  const stored = appendStoredPlanStep({
    ...clone(step),
  });
  updatePlanState(step.planId, plan.lifecycleState, plan.updatedAt, {
    steps: [...plan.steps, stored],
  });
  appendPlanAudit({
    planId: step.planId,
    eventType: "plan.step_appended",
    details: {
      stepId: step.stepId,
      order: step.order,
      type: step.type,
      tool: step.tool ?? null,
    },
  });
  return stored;
}

export function updatePlanState(planId: string, state: PersistedPlan["state"], updatedAt = 0, fields?: Partial<PersistedPlan>) {
  const plan = getPlan(planId);
  const nextState = fields?.lifecycleState ?? state;
  const steps = clone(fields?.steps ?? plan.steps);
  const lifecycleEvents = readLifecycleEvents(planId);
  const validationHash = fields?.validation?.validationHash ?? fields?.planHash ?? plan.validation.validationHash;
  const governanceHash = fields?.validation?.governanceHash ?? fields?.governanceDecisionHash ?? plan.validation.governanceHash;
  const integrity = buildIntegrity({
    planId,
    lifecycleState: nextState,
    steps,
    planHash: validationHash,
    governanceDecisionHash: governanceHash,
    lifecycleEvents,
  });
  const updatedPlan: PersistedPlan = {
    ...plan,
    ...clone(fields ?? {}),
    lifecycleState: nextState,
    state: nextState,
    steps,
    validation: {
      ...plan.validation,
      ...(clone(fields?.validation ?? {})),
      validationHash,
      governanceHash,
    },
    approvals: {
      ...plan.approvals,
      ...(clone(fields?.approvals ?? {})),
    },
    metadata: {
      ...plan.metadata,
      ...(clone(fields?.metadata ?? {})),
      updatedAt,
    },
    integrity,
    createdAt: plan.metadata.createdAt,
    updatedAt,
    planHash: validationHash,
    governanceDecisionHash: governanceHash,
    validationPassed: fields?.validation?.valid ?? fields?.validationPassed ?? plan.validationPassed,
    approvalRequired: fields?.approvals?.approvalRequired ?? fields?.approvalRequired ?? plan.approvalRequired,
    approvalState: fields?.approvalState ?? plan.approvalState,
    executionBlocked:
      fields?.executionBlocked
      ?? (fields?.validation ? !((fields.validation?.executionEligible) ?? plan.validation.executionEligible) : plan.executionBlocked),
    validatorVersion: fields?.validation?.validatorVersion ?? fields?.validatorVersion ?? plan.validatorVersion,
    registryVersion: fields?.validation?.registryVersion ?? fields?.registryVersion ?? plan.registryVersion,
    governanceVersion: fields?.validation?.governanceVersion ?? fields?.governanceVersion ?? plan.governanceVersion,
  };
  writePlan(updatedPlan);
  return updatedPlan;
}

export function appendLifecycleEvent(event: PlanLifecycleEvent) {
  getPlan(event.planId);
  const storedEvent = appendStoredLifecycleEvent({
    ...clone(event),
    createdAt: event.timestamp,
  });
  const plan = getPlan(event.planId);
  updatePlanState(event.planId, plan.lifecycleState, event.timestamp, {});
  appendPlanAudit({
    planId: event.planId,
    eventType: "plan.lifecycle_event",
    details: {
      eventType: event.eventType,
      previousState: event.previousState ?? null,
      nextState: event.nextState,
      actor: event.actor,
      reason: event.reason ?? null,
    },
  });
  return storedEvent;
}

export function bindValidationSnapshot(planId: string, validationResult: PlanValidationResult, governance?: GovernanceValidationInput) {
  const plan = getPlan(planId);
  const snapshot = capturePlanValidationSnapshot({
    validationResult,
    schemaVersion: plan.schemaVersion,
  });

  const eligibility = {
    eligible: validationResult.executionEligible,
    blocked: !validationResult.executionEligible,
    frozen: validationResult.frozen,
    planId,
    validationId: validationResult.validationId,
    snapshotId: snapshot.snapshotId,
    reasons: [
      ...validationResult.blockedReasons,
      ...validationResult.freezeReasons,
    ],
    requiredApproval: validationResult.approvalRequired,
    governanceDecision: validationResult.governanceDecision,
    checkedAt: validationResult.validatedAt,
  };

  writeValidationBinding(planId, {
    snapshot,
    validationResult,
    eligibility,
    governance,
  });

  const updatedPlan = updatePlanState(planId, plan.state, plan.updatedAt, {
    validation: {
      validationSnapshotId: snapshot.snapshotId,
      validationHash: validationResult.planHash,
      governanceHash: validationResult.governanceDecisionHash,
      validatorVersion: validationResult.validatorVersion,
      registryVersion: validationResult.registryVersion,
      governanceVersion: validationResult.governanceVersion,
      valid: validationResult.valid,
      executionEligible: validationResult.executionEligible,
      validatedAt: validationResult.validatedAt,
    },
    approvals: {
      approvalRequired: validationResult.approvalRequired,
      approved: false,
    },
    validationSnapshotId: snapshot.snapshotId,
    planHash: validationResult.planHash,
    governanceDecisionHash: validationResult.governanceDecisionHash,
    approvalRequired: validationResult.approvalRequired,
    approvalState: validationResult.approvalRequired ? "PENDING" : "NONE",
    riskLevel: validationResult.riskLevel,
    executionBlocked: !validationResult.executionEligible,
    frozenReason: validationResult.freezeReasons[0],
    validatorVersion: validationResult.validatorVersion,
    registryVersion: validationResult.registryVersion,
    governanceVersion: validationResult.governanceVersion,
  });

  appendPlanAudit({
    planId,
    eventType: "plan.validation_snapshot_bound",
    details: {
      snapshotId: snapshot.snapshotId,
      validationId: validationResult.validationId,
      executionEligible: validationResult.executionEligible,
      frozen: validationResult.frozen,
    },
  });

  return {
    plan: updatedPlan,
    snapshot,
    validationResult,
    eligibility,
  };
}

export function getPlanHistory(planId: string) {
  getPlan(planId);
  return {
    plan: getPlan(planId),
    steps: listPlanSteps(planId),
    lifecycleEvents: readLifecycleEvents(planId),
    validationBinding: readValidationBinding(planId),
  };
}
