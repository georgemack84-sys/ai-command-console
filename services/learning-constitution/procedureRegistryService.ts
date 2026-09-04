import type { DurableProcedure, HumanAuthorizedProcedure, ProcedureArtifactStore, ProcedureRegistry, ProcedureSimulationInput, ProcedureSimulationResult } from "../../types/learning-constitution/procedureLearning";
import type { LearningAuditLedger } from "../../types/learning-constitution/learningAuditLedger";
import { canonicalizeAuditValue } from "./auditIntegrityHash";

export class InMemoryProcedureRegistry implements ProcedureRegistry {
  private readonly procedures = new Map<string, DurableProcedure>();
  async append(procedure: DurableProcedure): Promise<DurableProcedure> { const existing = this.procedures.get(procedure.durableProcedureId); if (existing && canonicalizeAuditValue(existing) !== canonicalizeAuditValue(procedure)) throw new Error("durable procedure id collision"); this.procedures.set(procedure.durableProcedureId, existing ?? procedure); return existing ?? procedure; }
  async list() { return [...this.procedures.values()]; }
}

/** Registry admission requires the completed durable-learning transaction; it does not grant execution permission. */
export class ProcedureRegistryService {
  constructor(private readonly registry: ProcedureRegistry, private readonly audit?: LearningAuditLedger, private readonly artifacts?: ProcedureArtifactStore) {}
  async register(input: Readonly<{ durableProcedureId: string; durableKnowledgeId: string; authorized: HumanAuthorizedProcedure; createdAt: string; supersedesProcedureId?: string }>, workspaceId: string, correlationId: string): Promise<DurableProcedure> {
    if (!input.durableKnowledgeId.trim() || input.authorized.authority !== "HUMAN_DIRECTIVE" || input.authorized.status !== "PENDING_CONFLICT_AND_GATE") throw new Error("procedure registry requires a human-authorized gate commit");
    const procedure: DurableProcedure = { durableProcedureId: input.durableProcedureId, durableKnowledgeId: input.durableKnowledgeId, procedure: input.authorized.procedure, authorizedProcedureId: input.authorized.authorizedProcedureId, status: "ACTIVE", supersedesProcedureId: input.supersedesProcedureId, createdAt: input.createdAt, immutable: true, executionPermissionGranted: false };
    const stored = await this.registry.append(procedure);
    await this.artifacts?.append({ artifactId: `DURABLE_PROCEDURE:${stored.durableProcedureId}`, artifactType: "DURABLE_PROCEDURE", subjectId: stored.procedure.procedureId, payload: stored, createdAt: stored.createdAt });
    if (this.audit) await this.audit.append({ eventId: `audit:procedure-registered:${stored.durableProcedureId}`, eventType: "PROCEDURE_REGISTERED", workspaceId, occurredAt: stored.createdAt, actor: input.authorized.authorizedBy, correlationId, schemaVersion: "10.0", references: { knowledgeIds: [stored.durableKnowledgeId], provenanceIds: [stored.procedure.teachingEventId] }, payload: { procedureId: stored.procedure.procedureId, version: stored.procedure.version, supersedesProcedureId: stored.supersedesProcedureId, executionPermissionGranted: false } });
    return stored;
  }
}

/** Dry run validates readiness only. It intentionally performs no step, recovery, or verification action. */
export class ProcedureSimulationService {
  constructor(private readonly audit?: LearningAuditLedger, private readonly artifacts?: ProcedureArtifactStore) {}
  async simulate(procedure: DurableProcedure, input: ProcedureSimulationInput, workspaceId: string, actor: { actorId: string; actorType: "HUMAN" | "AGENT" | "SYSTEM" | "EXTERNAL" }, correlationId: string): Promise<ProcedureSimulationResult> {
    const candidate = procedure.procedure; const facts = new Set(input.satisfiedPreconditions); const exceptions = new Set(input.applicableExceptionIds ?? []);
    const missingInputs = candidate.inputs.filter((item) => item.kind === "REQUIRED" && !(item.inputId in input.inputs) && !item.derivable).map((item) => item.inputId);
    const failedPreconditions = candidate.preconditions.filter((condition) => !facts.has(condition)); const unresolvedDecisionIds = candidate.decisionPoints.filter((point) => !input.decisionOutcomes?.[point.decisionId]).map((point) => point.decisionId);
    const status = missingInputs.length || failedPreconditions.length || unresolvedDecisionIds.length ? "DEFERRED" : "READY_FOR_AUTHORIZED_EXECUTION";
    const result: ProcedureSimulationResult = { durableProcedureId: procedure.durableProcedureId, status, missingInputs, failedPreconditions, unresolvedDecisionIds, applicableExceptionIds: candidate.exceptions.filter((exception) => exceptions.has(exception.exceptionId)).map((exception) => exception.exceptionId), plannedStepIds: candidate.steps.map((step) => step.stepId), plannedVerificationIds: candidate.verification.map((item) => item.verificationId), persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false, simulated: true };
    await this.artifacts?.append({ artifactId: `PROCEDURE_SIMULATION:${correlationId}`, artifactType: "PROCEDURE_SIMULATION", subjectId: candidate.procedureId, payload: result, createdAt: new Date().toISOString() });
    if (this.audit) await this.audit.append({ eventId: `audit:procedure-simulation:${correlationId}`, eventType: "PROCEDURE_SIMULATION_EVALUATED", workspaceId, occurredAt: new Date().toISOString(), actor, correlationId, schemaVersion: "10.0", references: { knowledgeIds: [procedure.durableKnowledgeId], provenanceIds: [candidate.teachingEventId] }, payload: { durableProcedureId: procedure.durableProcedureId, status: result.status, missingInputs, failedPreconditions, unresolvedDecisionIds, simulated: true } });
    return result;
  }
}
