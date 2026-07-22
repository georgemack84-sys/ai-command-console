import { getPersistentIntelligenceExplainabilityContract, runPersistentIntelligenceExplainability, validatePersistentIntelligenceExplainability } from "@/services/persistent-intelligence-explainability";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { ExplainabilityInput, ExplainabilityResult } from "@/types/persistent-intelligence-explainability";

export async function requireExplainabilityUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): ExplainabilityInput { return body as ExplainabilityInput; }
function resultFromBody(body: Record<string, unknown>): ExplainabilityResult { return (body.result as ExplainabilityResult | undefined) ?? runPersistentIntelligenceExplainability(inputFromBody(body)); }
export function contractResponse() { return getPersistentIntelligenceExplainabilityContract(); }
export async function dashboardRequest(request?: Request) { if (!request) return runPersistentIntelligenceExplainability(); return runPersistentIntelligenceExplainability(inputFromBody(await readBody(request))); }
export async function validateRequest(request: Request) { return validatePersistentIntelligenceExplainability(resultFromBody(await readBody(request))); }
export async function artifactRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPersistentIntelligenceExplainability(); return { explanation: result.explanation, graph: result.graph, certification: result.certification }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPersistentIntelligenceExplainability(); return { evidence_trace: result.evidence_trace, explanation_id: result.explanation.explanation_id }; }
export async function qualificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPersistentIntelligenceExplainability(); return { qualification_history: result.qualification_history, evidence_trace: result.evidence_trace }; }
export async function confidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPersistentIntelligenceExplainability(); return { confidence_evolution: result.confidence_evolution, evidence_trace: result.evidence_trace }; }
export async function governanceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPersistentIntelligenceExplainability(); return { governance_history: result.governance_history, governance_certified: result.governance_certified }; }
export async function replayRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPersistentIntelligenceExplainability(); return { replay_lineage: result.replay_lineage, replay_hash: result.replay_hash }; }
export async function usageRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPersistentIntelligenceExplainability(); return { usage: result.usage, explanation_id: result.explanation.explanation_id }; }
export async function ledgerRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPersistentIntelligenceExplainability(); return { ledger: result.ledger, certification: result.certification, replay_hash: result.replay_hash }; }
export async function observabilityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPersistentIntelligenceExplainability(); return { status: result.certification.status, production_ready: result.certification.production_ready, observability: result.observability, integrity_hash: result.integrity_hash }; }
