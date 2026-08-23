import type { AuthorityGateRequest, AuthorityGateResult } from "./authorityEnforcement";
import type { KnowledgeAdmissionRequest, KnowledgeAdmissionResult, KnowledgeAdmissionService } from "./durableKnowledge";

export const AUTHORITY_GATED_ADMISSION_STATUSES = ["FORWARDED", "DENIED", "REVIEW_REQUIRED"] as const;
export type AuthorityGatedAdmissionStatus = (typeof AUTHORITY_GATED_ADMISSION_STATUSES)[number];
export type AuthorityGatedAdmissionReasonCode = "AUTHORITY_GATE_ALLOWED" | "AUTHORITY_GATE_DENIED" | "AUTHORITY_GATE_REVIEW_REQUIRED";

export type AuthorityGatedAdmissionRequest = Readonly<{
  authority: AuthorityGateRequest;
  knowledge: KnowledgeAdmissionRequest;
}>;
export type AuthorityGatedAdmissionResult = Readonly<{
  status: AuthorityGatedAdmissionStatus;
  reasonCode: AuthorityGatedAdmissionReasonCode;
  gate: AuthorityGateResult;
  admission?: KnowledgeAdmissionResult;
  persistenceEffect: "NONE" | "CREATED";
  authorityEffect: "UNCHANGED";
  executionPermissionGranted: false;
}>;
export interface AuthorityGatedKnowledgeAdmissionService {
  admit(request: AuthorityGatedAdmissionRequest): Promise<AuthorityGatedAdmissionResult>;
}
export type AuthorityGatedAdmissionDependencies = Readonly<{
  authorityGate: Readonly<{ evaluate(request: AuthorityGateRequest): AuthorityGateResult }>;
  knowledgeAdmission: KnowledgeAdmissionService;
}>;
