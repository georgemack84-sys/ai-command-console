import { getSyntheticIdentityDataGenerationBundle, runSyntheticIdentityDataGeneration, validateSyntheticIdentityDataGeneration } from "@/services/synthetic-identity-data-generation";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { SyntheticIdentityDataGenerationInput, SyntheticIdentityDataGenerationResult } from "@/types/synthetic-identity-data-generation";

export async function requireSyntheticIdentityDataGenerationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): SyntheticIdentityDataGenerationInput { return body as SyntheticIdentityDataGenerationInput; }
function resultFromBody(body: Record<string, unknown>): SyntheticIdentityDataGenerationResult { return (body.result as SyntheticIdentityDataGenerationResult | undefined) ?? runSyntheticIdentityDataGeneration(inputFromBody(body)); }

export function contractResponse() { return getSyntheticIdentityDataGenerationBundle(); }
export async function resultRequest(request?: Request) { return request ? resultFromBody(await readBody(request)) : runSyntheticIdentityDataGeneration(); }
export async function identitiesRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSyntheticIdentityDataGeneration(); return { identities: result.identities }; }
export async function datasetsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSyntheticIdentityDataGeneration(); return { datasets: result.datasets }; }
export async function originsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSyntheticIdentityDataGeneration(); return { origins: result.origins }; }
export async function integrityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSyntheticIdentityDataGeneration(); return { integrity_records: result.integrity_records }; }
export async function provenanceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSyntheticIdentityDataGeneration(); return { provenance_ledger: result.provenance_ledger }; }
export async function replayRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSyntheticIdentityDataGeneration(); return { replay: result.replay, replay_hash: result.replay_hash }; }
export async function governanceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSyntheticIdentityDataGeneration(); return { governance: result.governance, observability: result.observability }; }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSyntheticIdentityDataGeneration(); return { certification_tests: result.certification_tests, outcome: result.outcome }; }
export async function validateRequest(request: Request) { return validateSyntheticIdentityDataGeneration(resultFromBody(await readBody(request))); }
