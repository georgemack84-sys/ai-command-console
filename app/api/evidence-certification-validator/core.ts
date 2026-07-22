import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  getEvidenceCertificationValidatorFoundation,
  replayEvidenceCertificationValidation,
  validateEvidenceCertification,
} from "@/services/evidence-certification-validator";
import type { EvidenceCertificationValidatorInput, EvidenceCertificationValidatorResult } from "@/types/evidence-certification-validator";

export async function requireEvidenceCertificationValidatorUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function contractResponse() {
  return getEvidenceCertificationValidatorFoundation();
}

export async function validateRequest(request: Request) {
  const body = await readBody(request) as EvidenceCertificationValidatorInput;
  return validateEvidenceCertification(body);
}

export async function completenessRequest(request: Request) {
  const body = await readBody(request) as EvidenceCertificationValidatorInput;
  return validateEvidenceCertification(body).evidence_completeness_report;
}

export async function qualityRequest(request: Request) {
  const body = await readBody(request) as EvidenceCertificationValidatorInput;
  return validateEvidenceCertification(body).evidence_quality_assessment;
}

export async function lineageRequest(request: Request) {
  const body = await readBody(request) as EvidenceCertificationValidatorInput;
  return validateEvidenceCertification(body).evidence_lineage_graph;
}

export async function dependenciesRequest(request: Request) {
  const body = await readBody(request) as EvidenceCertificationValidatorInput;
  return validateEvidenceCertification(body).validation.dependency_graph;
}

export async function documentationRequest(request: Request) {
  const body = await readBody(request) as EvidenceCertificationValidatorInput;
  return validateEvidenceCertification(body).documentation_validation_report;
}

export async function simulationReadinessRequest(request: Request) {
  const body = await readBody(request) as EvidenceCertificationValidatorInput;
  return validateEvidenceCertification(body).simulation_readiness_assessment;
}

export async function rollbackRequest(request: Request) {
  const body = await readBody(request) as EvidenceCertificationValidatorInput;
  return validateEvidenceCertification(body).rollback_feasibility_report;
}

export async function readinessRequest(request: Request) {
  const body = await readBody(request) as EvidenceCertificationValidatorInput;
  const result = validateEvidenceCertification(body);
  return {
    validation_state: result.validation_state,
    certification_readiness: result.validation.certification_readiness,
    failures: result.failures,
    fail_closed: result.fail_closed,
    ready_for_simulation: result.validation_state === "READY_FOR_SIMULATION" && !result.fail_closed,
  };
}

export async function ledgerRequest(request: Request) {
  const body = await readBody(request) as EvidenceCertificationValidatorInput;
  return validateEvidenceCertification(body).ledger_entry;
}

export async function replayRequest(request: Request) {
  const body = await readBody(request) as Partial<EvidenceCertificationValidatorResult> & EvidenceCertificationValidatorInput;
  const result = body.validation && body.ledger_entry ? body as EvidenceCertificationValidatorResult : validateEvidenceCertification(body);
  return {
    replay_valid: replayEvidenceCertificationValidation(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
    replay_reference: result.validation.replay_reference,
  };
}

export async function inspectRequest(request?: Request) {
  if (!request) return getEvidenceCertificationValidatorFoundation();
  const body = await readBody(request) as EvidenceCertificationValidatorInput;
  const result = validateEvidenceCertification(body);
  return {
    validation_state: result.validation_state,
    failures: result.failures,
    quality_score: result.validation.evidence_quality_score,
    evidence_count: result.validation.supporting_evidence.length,
    fail_closed: result.fail_closed,
    tenant_isolated: result.tenant_isolated,
    audit_ready: result.audit_ready,
    replayable: result.replayable,
    trust_verifiable: result.trust_verifiable,
    advisory_only: result.advisory_only,
  };
}
