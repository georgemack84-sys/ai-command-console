import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  certifyPatternIntelligence,
  getPatternIntelligenceCertificationFoundation,
  replayPatternIntelligenceCertification,
} from "@/services/pattern-intelligence-certification-gate";
import type { PatternCertificationInput, PatternCertificationResult } from "@/types/pattern-intelligence-certification-gate";

export async function requirePatternCertificationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function getPatternCertificationContractResponse() {
  return getPatternIntelligenceCertificationFoundation();
}

export async function certifyRequest(request: Request) {
  const body = await readBody(request) as PatternCertificationInput;
  return certifyPatternIntelligence(body);
}

export async function statusRequest(request: Request) {
  const body = await readBody(request) as PatternCertificationInput;
  const result = certifyPatternIntelligence(body);
  return {
    certification_state: result.certification_record.certification_state,
    production_readiness_result: result.certification_record.production_readiness_result,
    adaptive_consumption_allowed: result.adaptive_consumption_allowed,
    failed_tests: result.certification_record.failed_tests,
  };
}

export async function reportRequest(request: Request) {
  const body = await readBody(request) as PatternCertificationInput;
  const result = certifyPatternIntelligence(body);
  return {
    certification_record: result.certification_record,
    determinism_report: result.determinism_report,
    replay_report: result.replay_report,
    governance_report: result.governance_report,
    constitutional_report: result.constitutional_report,
    integrity_report: result.integrity_report,
    tenant_isolation_report: result.tenant_isolation_report,
    explainability_report: result.explainability_report,
    production_readiness_report: result.production_readiness_report,
  };
}

export async function determinismRequest(request: Request) {
  const body = await readBody(request) as PatternCertificationInput;
  return certifyPatternIntelligence(body).determinism_report;
}

export async function replayCertificationRequest(request: Request) {
  const body = await readBody(request) as Partial<PatternCertificationResult> & PatternCertificationInput;
  const result = body.certification_record ? body as PatternCertificationResult : certifyPatternIntelligence(body);
  return {
    replay_valid: replayPatternIntelligenceCertification(result),
    replay_report: result.replay_report,
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
  };
}

export async function governanceCertificationRequest(request: Request) {
  const body = await readBody(request) as PatternCertificationInput;
  const result = certifyPatternIntelligence(body);
  return {
    governance_report: result.governance_report,
    constitutional_report: result.constitutional_report,
  };
}

export async function integrityCertificationRequest(request: Request) {
  const body = await readBody(request) as PatternCertificationInput;
  return certifyPatternIntelligence(body).integrity_report;
}

export async function tenantCertificationRequest(request: Request) {
  const body = await readBody(request) as PatternCertificationInput;
  return certifyPatternIntelligence(body).tenant_isolation_report;
}

export async function productionReadinessRequest(request: Request) {
  const body = await readBody(request) as PatternCertificationInput;
  return certifyPatternIntelligence(body).production_readiness_report;
}

export async function inspectRequest(request?: Request) {
  if (!request) return getPatternIntelligenceCertificationFoundation();
  const body = await readBody(request) as PatternCertificationInput;
  const result = certifyPatternIntelligence(body);
  return {
    certification_state: result.certification_record.certification_state,
    failed_tests: result.certification_record.failed_tests,
    adaptive_consumption_allowed: result.adaptive_consumption_allowed,
    evidence_based: result.evidence_based,
    governance_compliant: result.governance_compliant,
    constitutionally_compliant: result.constitutionally_compliant,
    tenant_isolated: result.tenant_isolated,
    advisory_only: result.advisory_only,
  };
}
