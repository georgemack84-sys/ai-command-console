import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  certifyAdaptationProposalEngine,
  getAdaptationProposalCertificationFoundation,
  replayAdaptationProposalCertification,
} from "@/services/adaptation-proposal-certification-gate";
import type { AdaptationProposalCertificationInput, AdaptationProposalCertificationResult } from "@/types/adaptation-proposal-certification-gate";

export async function requireAdaptationProposalCertificationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function contractResponse() {
  return getAdaptationProposalCertificationFoundation();
}

export async function certifyRequest(request: Request) {
  const body = await readBody(request) as AdaptationProposalCertificationInput;
  return certifyAdaptationProposalEngine(body);
}

export async function summaryRequest(request: Request) {
  const body = await readBody(request) as AdaptationProposalCertificationInput;
  return certifyAdaptationProposalEngine(body).summary;
}

export async function matrixRequest(request: Request) {
  const body = await readBody(request) as AdaptationProposalCertificationInput;
  return certifyAdaptationProposalEngine(body).certification_tests;
}

export async function deliverablesRequest(request: Request) {
  const body = await readBody(request) as AdaptationProposalCertificationInput;
  return certifyAdaptationProposalEngine(body).deliverables;
}

export async function metricsRequest(request: Request) {
  const body = await readBody(request) as AdaptationProposalCertificationInput;
  return certifyAdaptationProposalEngine(body).metrics;
}

export async function replayRequest(request: Request) {
  const body = await readBody(request) as Partial<AdaptationProposalCertificationResult> & AdaptationProposalCertificationInput;
  const result = body.certification_tests && body.metrics ? body as AdaptationProposalCertificationResult : certifyAdaptationProposalEngine(body);
  return {
    replay_valid: replayAdaptationProposalCertification(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
    certification_outcome: result.certification_outcome,
  };
}

export async function inspectRequest(request?: Request) {
  if (!request) return getAdaptationProposalCertificationFoundation();
  const body = await readBody(request) as AdaptationProposalCertificationInput;
  const result = certifyAdaptationProposalEngine(body);
  return {
    certification_outcome: result.certification_outcome,
    failures: result.failures,
    completed_tests: result.summary.completed_tests,
    passed_tests: result.summary.passed_tests,
    production_readiness_status: result.summary.production_readiness_status,
    progression_to_phase_10_11_authorized: result.summary.progression_to_phase_10_11_authorized,
    replayable: result.replayable,
    tenant_isolated: result.tenant_isolated,
    advisory_only: result.advisory_only,
    authorizes_implementation: result.authorizes_implementation,
    authorizes_production_mutation: result.authorizes_production_mutation,
  };
}
