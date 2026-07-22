import { getStrategicAssuranceContract, runStrategicAssurance, validateStrategicAssurance } from "@/services/strategic-assurance";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { StrategicAssuranceInput, StrategicAssuranceResult } from "@/types/strategic-assurance";

export async function requireStrategicAssuranceUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): StrategicAssuranceInput { return body as StrategicAssuranceInput; }
function resultFromBody(body: Record<string, unknown>): StrategicAssuranceResult { return (body.result as StrategicAssuranceResult | undefined) ?? runStrategicAssurance(inputFromBody(body)); }

export function contractResponse() { return getStrategicAssuranceContract(); }
export async function resultRequest(request?: Request) { return request ? resultFromBody(await readBody(request)) : runStrategicAssurance(); }
export async function lineageRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runStrategicAssurance(); return { lineage_graph: result.lineage_graph }; }
export async function originRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runStrategicAssurance(); return { origin_validation: result.origin_validation }; }
export async function cycleReplayRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runStrategicAssurance(); return { cycle_replay: result.cycle_replay, replay_hash: result.replay_hash }; }
export async function artifactReplayRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runStrategicAssurance(); return { artifact_replay: result.artifact_replay, replay_hash: result.replay_hash }; }
export async function divergenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runStrategicAssurance(); return { divergence: result.divergence }; }
export async function integrityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runStrategicAssurance(); return { integrity: result.integrity, integrity_hash: result.integrity_hash }; }
export async function ownershipRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runStrategicAssurance(); return { ownership: result.ownership }; }
export async function explainRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runStrategicAssurance(); return { explainability: result.explainability }; }
export async function ledgerRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runStrategicAssurance(); return { ledger: result.ledger }; }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runStrategicAssurance(); return { certification: result.certification, integrity_hash: result.integrity_hash }; }
export async function validateRequest(request: Request) { return validateStrategicAssurance(resultFromBody(await readBody(request))); }
export async function observabilityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runStrategicAssurance(); return { observability: result.observability, certification_status: result.certification.status }; }
