import type { ImmutableAuditLedgerEntry } from "@/services/audit/immutableAuditLedger";
import type { ValidationSnapshot } from "@/services/validation/validationContracts";
import type { PersistedPlan, PersistedPlanStep, PlanLifecycleEvent, PlanValidationBinding } from "./planContracts";

type PlanStoreState = {
  plans: Map<string, PersistedPlan>;
  steps: Map<string, PersistedPlanStep[]>;
  lifecycleEvents: Map<string, PlanLifecycleEvent[]>;
  validationBindings: Map<string, PlanValidationBinding>;
  snapshots: Map<string, ValidationSnapshot>;
  auditEntries: Map<string, ImmutableAuditLedgerEntry<unknown>[]>;
};

const store: PlanStoreState = {
  plans: new Map(),
  steps: new Map(),
  lifecycleEvents: new Map(),
  validationBindings: new Map(),
  snapshots: new Map(),
  auditEntries: new Map(),
};

function clonePlan(plan: PersistedPlan) : PersistedPlan {
  return JSON.parse(JSON.stringify(plan));
}

function cloneStep(step: PersistedPlanStep) : PersistedPlanStep {
  return {
    ...step,
    input: JSON.parse(JSON.stringify(step.input)),
  };
}

function cloneEvent(event: PlanLifecycleEvent) : PlanLifecycleEvent {
  return {
    ...event,
    metadata: event.metadata ? JSON.parse(JSON.stringify(event.metadata)) : undefined,
  };
}

export function resetPlanStore() {
  store.plans.clear();
  store.steps.clear();
  store.lifecycleEvents.clear();
  store.validationBindings.clear();
  store.snapshots.clear();
  store.auditEntries.clear();
}

export function readPlan(planId: string) {
  const plan = store.plans.get(planId);
  return plan ? clonePlan(plan) : undefined;
}

export function writePlan(plan: PersistedPlan) {
  store.plans.set(plan.planId, clonePlan(plan));
  return clonePlan(plan);
}

export function readPlanSteps(planId: string) {
  return (store.steps.get(planId) ?? []).map(cloneStep);
}

export function appendStoredPlanStep(step: PersistedPlanStep) {
  const steps = store.steps.get(step.planId) ?? [];
  steps.push(cloneStep(step));
  store.steps.set(step.planId, steps);
  return cloneStep(step);
}

export function readLifecycleEvents(planId: string) {
  return (store.lifecycleEvents.get(planId) ?? []).map(cloneEvent);
}

export function appendStoredLifecycleEvent(event: PlanLifecycleEvent) {
  const events = store.lifecycleEvents.get(event.planId) ?? [];
  events.push(cloneEvent(event));
  store.lifecycleEvents.set(event.planId, events);
  return cloneEvent(event);
}

export function writeValidationBinding(planId: string, binding: PlanValidationBinding) {
  store.validationBindings.set(planId, binding);
  store.snapshots.set(binding.snapshot.snapshotId, binding.snapshot);
}

export function readValidationBinding(planId: string) {
  return store.validationBindings.get(planId);
}

export function readValidationSnapshot(snapshotId: string) {
  return store.snapshots.get(snapshotId);
}

export function appendPlanAuditEntry(planId: string, entry: ImmutableAuditLedgerEntry<unknown>) {
  const entries = store.auditEntries.get(planId) ?? [];
  entries.push(entry);
  store.auditEntries.set(planId, entries);
  return entry;
}

export function readPlanAuditEntries(planId: string) {
  return [...(store.auditEntries.get(planId) ?? [])];
}
