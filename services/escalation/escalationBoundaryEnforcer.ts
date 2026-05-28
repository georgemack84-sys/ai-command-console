import type { EscalationAuthorityContract, EscalationError } from "@/types/escalation";

const FORBIDDEN_METADATA_KEYS = [
  "schedulerId",
  "queueId",
  "workerId",
  "runtimeHandle",
  "dispatchId",
  "retryLoop",
  "repairReplay",
  "resumeCoordination",
  "modifyPolicy",
  "remediate",
];

const READ_ONLY_TOKENS = [
  "dispatch(",
  "setTimeout(",
  "setInterval(",
  "retryLoop",
  "resume(",
  "repairReplay",
  "schedulerId",
  "workerId",
  "runtimeHandle",
];

export function createEscalationError(code: EscalationError["code"], message: string, path: string): EscalationError {
  return Object.freeze({ code, message, path });
}

export function buildEscalationAuthorityContract(): EscalationAuthorityContract {
  return Object.freeze({
    mayAuthorizeExecution: false,
    mayAdvanceLifecycle: false,
    mayRepairReplay: false,
    mayRestoreTrust: false,
    mayResumeCoordination: false,
    mayBypassGovernance: false,
    mayGenerateApproval: false,
    mayModifyPolicy: false,
  });
}

export function enforceEscalationBoundary(input: {
  authorityContract: EscalationAuthorityContract;
  metadata?: Readonly<Record<string, unknown>>;
}): readonly EscalationError[] {
  const errors: EscalationError[] = [];
  if (Object.values(input.authorityContract).some((value) => value !== false)) {
    errors.push(createEscalationError(
      "ESCALATION_EXECUTION_LEAK_REJECTED",
      "Escalation authority contract must remain false-only.",
      "authorityContract",
    ));
  }
  for (const key of Object.keys(input.metadata ?? {})) {
    if (FORBIDDEN_METADATA_KEYS.includes(key)) {
      errors.push(createEscalationError(
        key === "schedulerId" ? "ESCALATION_SCHEDULING_REJECTED"
        : key === "retryLoop" ? "ESCALATION_RETRY_REJECTED"
        : key === "repairReplay" ? "ESCALATION_SYNTHETIC_REPLAY_REJECTED"
        : key === "resumeCoordination" ? "ESCALATION_PAUSE_RESUME_FORBIDDEN"
        : key === "modifyPolicy" ? "ESCALATION_GOVERNANCE_MISMATCH"
        : key === "dispatchId" ? "ESCALATION_ORCHESTRATION_LEAK_REJECTED"
        : "ESCALATION_REMEDIATION_FORBIDDEN",
        `Forbidden escalation metadata detected: ${key}.`,
        `metadata.${key}`,
      ));
    }
  }
  return Object.freeze(errors);
}

export function assertEscalationSourcesAreReadOnly(source: string): readonly string[] {
  return Object.freeze(
    READ_ONLY_TOKENS.filter((token) => source.includes(token)).map((token) => `forbidden token detected: ${token}`),
  );
}
