import type { AuthorityGateRequest, AuthorityGateResult } from "./authorityEnforcement";
import type { DurableLearningGateRequest } from "./durableLearningGate";
import type { KnowledgeAdmissionRequest } from "./durableKnowledge";

export const AUTHORITY_GATED_ADMISSION_STATUSES = ["FORWARDED", "DENIED", "REVIEW_REQUIRED", "DEFERRED", "REJECTED", "RE_EVALUATION_REQUIRED"] as const;
export type AuthorityGatedAdmissionStatus = (typeof AUTHORITY_GATED_ADMISSION_STATUSES)[number];
export type AuthorityGatedAdmissionReasonCode = "AUTHORITY_GATE_ALLOWED" | "AUTHORITY_GATE_DENIED" | "AUTHORITY_GATE_REVIEW_REQUIRED" | "DURABLE_GATE_DEFERRED" | "DURABLE_GATE_REJECTED" | "REGISTRY_REEVALUATION_REQUIRED";

export type AuthorityGatedAdmissionRequest = Readonly<{
  authority: AuthorityGateRequest;
  promotion: Readonly<{
    gateRequest: Omit<DurableLearningGateRequest, "authority">;
    admission: KnowledgeAdmissionRequest;
  }>;
}>;
export type AuthorityGatedAdmissionResult = Readonly<{
  status: AuthorityGatedAdmissionStatus;
  reasonCode: AuthorityGatedAdmissionReasonCode;
  gate: AuthorityGateResult;
  promotion?: Readonly<{ status: "COMMITTED" | "DEFERRED" | "REJECTED" | "RE_EVALUATION_REQUIRED" }>;
  persistenceEffect: "NONE" | "CREATED";
  authorityEffect: "UNCHANGED";
  executionPermissionGranted: false;
}>;
export interface AuthorityGatedKnowledgeAdmissionService {
  admit(request: AuthorityGatedAdmissionRequest): Promise<AuthorityGatedAdmissionResult>;
}
export type AuthorityGatedAdmissionDependencies = Readonly<{
  authorityGate: Readonly<{ evaluate(request: AuthorityGateRequest): AuthorityGateResult }>;
  promotion: Readonly<{
    promote(input: Readonly<{ gateRequest: DurableLearningGateRequest; admission: KnowledgeAdmissionRequest }>): Promise<Readonly<{
      status: "COMMITTED" | "DEFERRED" | "REJECTED" | "RE_EVALUATION_REQUIRED";
      persistenceEffect: "CREATED" | "NONE";
    }>>;
  }>;
}>;
