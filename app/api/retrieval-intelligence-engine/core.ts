import { getRetrievalIntelligenceContract, runRetrievalIntelligence, validateRetrievalIntelligence } from "@/services/retrieval-intelligence-engine";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { RetrievalInput, RetrievalResult } from "@/types/retrieval-intelligence-engine";

export async function requireRetrievalIntelligenceUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function inputFromBody(body: Record<string, unknown>): RetrievalInput {
  return body as RetrievalInput;
}

function resultFromBody(body: Record<string, unknown>): RetrievalResult {
  return (body.result as RetrievalResult | undefined) ?? runRetrievalIntelligence(inputFromBody(body));
}

export function contractResponse() {
  return getRetrievalIntelligenceContract();
}

export async function dashboardRequest(request?: Request) {
  if (!request) return runRetrievalIntelligence();
  return runRetrievalIntelligence(inputFromBody(await readBody(request)));
}

export async function validateRequest(request: Request) {
  return validateRetrievalIntelligence(resultFromBody(await readBody(request)));
}

export async function resultsRequest(request?: Request) {
  const result = request ? resultFromBody(await readBody(request)) : runRetrievalIntelligence();
  return { record: result.record, approved_records: result.approved_records, rejected_records: result.rejected_records, rankings: result.rankings };
}

export async function explanationRequest(request?: Request) {
  const result = request ? resultFromBody(await readBody(request)) : runRetrievalIntelligence();
  return { explanation: result.explanation, evidence_refs: result.record.evidence_refs, retrieval_confidence: result.record.retrieval_confidence };
}

export async function ledgerRequest(request?: Request) {
  const result = request ? resultFromBody(await readBody(request)) : runRetrievalIntelligence();
  return { ledger: result.ledger, certification: result.certification, replay_hash: result.replay_hash };
}

export async function observabilityRequest(request?: Request) {
  const result = request ? resultFromBody(await readBody(request)) : runRetrievalIntelligence();
  return { status: result.certification.status, production_ready: result.certification.production_ready, observability: result.observability, integrity_hash: result.integrity_hash };
}
