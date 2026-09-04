import { prisma } from "../../src/server/db/prisma";
import { createHash } from "node:crypto";
import type { DurableLearningGateRequest, GateDecision } from "../../types/learning-constitution/durableLearningGate";
import type { KnowledgeAdmissionRequest } from "../../types/learning-constitution/durableKnowledge";
import { createGateInputFingerprint } from "./durableLearningGate";
import type { ControlledRegistryWriteResult, ControlledRegistryWriterContract } from "./controlledRegistryWriter";
import type { LearningAuditEntry, LearningAuditEvent } from "../../types/learning-constitution/learningAuditLedger";
import { canonicalizeAuditValue } from "./auditIntegrityHash";

type RegistryState = Readonly<{ version: number }>;
type DurableRecord = Readonly<{ candidateFingerprint: string; gateDecisionId: string }>;
type AuditRow = Readonly<{ eventHash: string }>;
type TransactionClient = Readonly<{
  noesisDurableRegistryState: Readonly<{ findUnique(args: object): Promise<RegistryState | null>; create(args: object): Promise<RegistryState>; update(args: object): Promise<RegistryState> }>;
  noesisDurableKnowledgeRecord: Readonly<{ findUnique(args: object): Promise<DurableRecord | null>; create(args: object): Promise<DurableRecord> }>;
  noesisLearningAuditEvent: Readonly<{ findMany(args: object): Promise<AuditRow[]>; create(args: object): Promise<AuditRow> }>;
}>;
type Client = TransactionClient & Readonly<{ $transaction<T>(operation: (transaction: TransactionClient) => Promise<T>, options?: object): Promise<T> }>;
const client = prisma as unknown as Client;

const sameScope = (left: DurableLearningGateRequest["scope"]["scope"], right: DurableLearningGateRequest["scope"]["scope"]): boolean =>
  Boolean(left && right && left.type === right.type && ("id" in left ? left.id : undefined) === ("id" in right ? right.id : undefined));
const auditHash = (event: LearningAuditEvent, sequence: number, previousHash: string | null) => createHash("sha256").update(canonicalizeAuditValue({ event, sequence, previousHash }), "utf8").digest("hex");

/** The production Phase 9 writer: authorization and registry version are checked in one transaction. */
export class PrismaDurableRegistryWriter implements ControlledRegistryWriterContract {
  constructor(private readonly workspaceId: string, private readonly db: Client = client) {}

  async commit(input: Readonly<{ gateRequest: DurableLearningGateRequest; decision: GateDecision; admission: KnowledgeAdmissionRequest }>): Promise<ControlledRegistryWriteResult> {
    const authorization = input.decision.commitAuthorization;
    const fingerprint = createGateInputFingerprint(input.gateRequest);
    if (!this.workspaceId.trim() || !authorization || input.decision.outcome !== "ACCEPT" || authorization.candidateId !== input.gateRequest.candidate.candidateId || authorization.candidateFingerprint !== fingerprint || authorization.classification !== input.gateRequest.candidate.classification || !sameScope(authorization.scope, input.gateRequest.scope.scope) || authorization.gateVersion !== input.gateRequest.context.gateVersion || authorization.registryVersion !== input.gateRequest.context.registryVersion || input.admission.candidate.candidateId !== authorization.candidateId) {
      return this.result("REJECTED", "COMMIT_AUTHORIZATION_INVALID");
    }

    const expectedVersion = Number(authorization.registryVersion);
    if (!Number.isInteger(expectedVersion) || expectedVersion < 0) return this.result("REJECTED", "COMMIT_AUTHORIZATION_INVALID");
    try {
      return await this.db.$transaction(async (transaction) => {
        const state = await transaction.noesisDurableRegistryState.findUnique({ where: { workspaceId: this.workspaceId } });
        const currentVersion = state?.version ?? 0;
        const existing = await transaction.noesisDurableKnowledgeRecord.findUnique({ where: { workspaceId_candidateId: { workspaceId: this.workspaceId, candidateId: authorization.candidateId } } });
        if (existing) {
          if (existing.candidateFingerprint !== authorization.candidateFingerprint || existing.gateDecisionId !== authorization.evaluationId) return this.result("REJECTED", "COMMIT_AUTHORIZATION_INVALID");
          return { ...this.result("COMMITTED", "IDEMPOTENT_REPLAY"), persistenceEffect: "NONE" };
        }
        if (currentVersion !== expectedVersion) return this.result("RE_EVALUATION_REQUIRED", "REGISTRY_VERSION_CHANGED");
        const nextVersion = currentVersion + 1;
        if (state) await transaction.noesisDurableRegistryState.update({ where: { workspaceId: this.workspaceId }, data: { version: nextVersion } });
        else await transaction.noesisDurableRegistryState.create({ data: { stateId: `registry:${this.workspaceId}`, workspaceId: this.workspaceId, version: nextVersion } });
        await transaction.noesisDurableKnowledgeRecord.create({ data: { knowledgeId: `knowledge:${this.workspaceId}:${authorization.candidateId}`, workspaceId: this.workspaceId, candidateId: authorization.candidateId, candidateFingerprint: authorization.candidateFingerprint, gateDecisionId: authorization.evaluationId, registryVersion: nextVersion, payload: { candidate: input.gateRequest.candidate, scope: authorization.scope, decision: input.decision, policyVersion: input.admission.decision.policyVersion, constitutionVersion: input.admission.decision.constitutionVersion } } });
        const auditRows = await transaction.noesisLearningAuditEvent.findMany({ where: { workspaceId: this.workspaceId }, orderBy: { sequence: "asc" } });
        const previousHash = auditRows.at(-1)?.eventHash ?? null;
        const event: LearningAuditEvent = { eventId: `learning-audit:commit:${authorization.evaluationId}`, eventType: "DURABLE_KNOWLEDGE_COMMITTED", workspaceId: this.workspaceId, occurredAt: input.gateRequest.candidate.provenance.observedAt, actor: { actorId: input.decision.context.decisionActorId, actorType: input.decision.context.decisionActorId.startsWith("user:") ? "HUMAN" : "SYSTEM" }, correlationId: authorization.evaluationId, causationId: `learning-audit:gate:${authorization.evaluationId}`, schemaVersion: "10.0", references: { knowledgeIds: [`knowledge:${this.workspaceId}:${authorization.candidateId}`], provenanceIds: [input.gateRequest.candidate.provenance.observationId], gateEvaluationId: authorization.evaluationId, pipelineId: input.gateRequest.candidate.provenance.sourceId }, payload: { candidateId: authorization.candidateId, registryVersion: nextVersion, gateVersion: authorization.gateVersion } };
        const entry: LearningAuditEntry = { sequence: auditRows.length + 1, previousHash, eventHash: auditHash(event, auditRows.length + 1, previousHash), event };
        await transaction.noesisLearningAuditEvent.create({ data: { eventId: event.eventId, workspaceId: this.workspaceId, sequence: entry.sequence, previousHash, eventHash: entry.eventHash, eventType: event.eventType, correlationId: event.correlationId, knowledgeIds: event.references.knowledgeIds ?? [], payload: entry as object, occurredAt: new Date(event.occurredAt) } });
        return this.result("COMMITTED", "DURABLE_KNOWLEDGE_COMMITTED");
      }, { isolationLevel: "Serializable" });
    } catch {
      // A serializable conflict or persistence failure must not be represented as a commit.
      return this.result("RE_EVALUATION_REQUIRED", "REGISTRY_VERSION_CHANGED");
    }
  }

  private result(status: ControlledRegistryWriteResult["status"], reasonCode: ControlledRegistryWriteResult["reasonCode"]): ControlledRegistryWriteResult {
    return { status, reasonCode, persistenceEffect: status === "COMMITTED" ? "CREATED" : "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false };
  }
}
