import type { DurableLearningGateRequest, GateDecision } from "../../types/learning-constitution/durableLearningGate";
import type { KnowledgeAdmissionRequest, KnowledgeAdmissionResult, KnowledgeAdmissionService } from "../../types/learning-constitution/durableKnowledge";
import { createGateInputFingerprint } from "./durableLearningGate";

const sameScope = (
  left: DurableLearningGateRequest["scope"]["scope"],
  right: DurableLearningGateRequest["scope"]["scope"],
): boolean =>
  Boolean(left && right && left.type === right.type && ("id" in left ? left.id : undefined) === ("id" in right ? right.id : undefined));

export type ControlledRegistryWriteResult = Readonly<{
  status: "COMMITTED" | "REJECTED" | "RE_EVALUATION_REQUIRED";
  reasonCode: "DURABLE_KNOWLEDGE_COMMITTED" | "IDEMPOTENT_REPLAY" | "COMMIT_AUTHORIZATION_INVALID" | "REGISTRY_VERSION_CHANGED";
  admission?: KnowledgeAdmissionResult;
  persistenceEffect: "CREATED" | "NONE";
  authorityEffect: "UNCHANGED";
  executionPermissionGranted: false;
}>;

export interface RegistryVersionProvider {
  currentVersion(): Promise<string>;
}

export interface ControlledRegistryWriterContract {
  commit(input: Readonly<{
    gateRequest: DurableLearningGateRequest;
    decision: GateDecision;
    admission: KnowledgeAdmissionRequest;
  }>): Promise<ControlledRegistryWriteResult>;
}

/**
 * The sole Phase 9 writer adapter. It accepts a capability only when it is
 * bound to the exact candidate and registry state that were evaluated.
 */
export class ControlledRegistryWriter implements ControlledRegistryWriterContract {
  constructor(private readonly dependencies: Readonly<{
    registryVersion: RegistryVersionProvider;
    knowledgeAdmission: KnowledgeAdmissionService;
  }>) {}

  async commit(input: Readonly<{
    gateRequest: DurableLearningGateRequest;
    decision: GateDecision;
    admission: KnowledgeAdmissionRequest;
  }>): Promise<ControlledRegistryWriteResult> {
    const authorization = input.decision.commitAuthorization;
    const fingerprint = createGateInputFingerprint(input.gateRequest);
    const authorizationIsBound = Boolean(
      input.decision.outcome === "ACCEPT" &&
      authorization &&
      authorization.evaluationId === input.decision.evaluationId &&
      authorization.candidateId === input.gateRequest.candidate.candidateId &&
      authorization.candidateFingerprint === fingerprint &&
      authorization.classification === input.gateRequest.candidate.classification &&
      sameScope(authorization.scope, input.gateRequest.scope.scope) &&
      authorization.gateVersion === input.gateRequest.context.gateVersion &&
      authorization.registryVersion === input.gateRequest.context.registryVersion &&
      input.admission.candidate.candidateId === authorization?.candidateId &&
      input.admission.candidate.classification === authorization?.classification &&
      sameScope(input.admission.scopeResolution.scope, authorization?.scope),
    );
    if (!authorizationIsBound) return this.result("REJECTED", "COMMIT_AUTHORIZATION_INVALID");

    if (await this.dependencies.registryVersion.currentVersion() !== authorization!.registryVersion) {
      return this.result("RE_EVALUATION_REQUIRED", "REGISTRY_VERSION_CHANGED");
    }

    const admission = await this.dependencies.knowledgeAdmission.admit(input.admission);
    return {
      status: admission.status === "ADMITTED" ? "COMMITTED" : "REJECTED",
      reasonCode: admission.status === "ADMITTED" ? "DURABLE_KNOWLEDGE_COMMITTED" : "COMMIT_AUTHORIZATION_INVALID",
      admission,
      persistenceEffect: admission.persistenceEffect,
      authorityEffect: "UNCHANGED",
      executionPermissionGranted: false,
    };
  }

  private result(status: "REJECTED" | "RE_EVALUATION_REQUIRED", reasonCode: "COMMIT_AUTHORIZATION_INVALID" | "REGISTRY_VERSION_CHANGED"): ControlledRegistryWriteResult {
    return { status, reasonCode, persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false };
  }
}
