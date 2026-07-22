import { getSpecificationIntegrityConsistencyValidationBundle, runSpecificationIntegrityConsistencyValidation, validateSpecificationIntegrityConsistencyValidation } from "@/services/specification-integrity-consistency-validation";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { SpecificationIntegrityInput, SpecificationIntegrityValidationResult } from "@/types/specification-integrity-consistency-validation";

export async function requireSpecificationIntegrityUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): SpecificationIntegrityInput { return body as SpecificationIntegrityInput; }
function resultFromBody(body: Record<string, unknown>): SpecificationIntegrityValidationResult { return (body.result as SpecificationIntegrityValidationResult | undefined) ?? runSpecificationIntegrityConsistencyValidation(inputFromBody(body)); }

export function contractResponse() { return getSpecificationIntegrityConsistencyValidationBundle(); }
export async function resultRequest(request?: Request) { return request ? resultFromBody(await readBody(request)) : runSpecificationIntegrityConsistencyValidation(); }
export async function vocabularyRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSpecificationIntegrityConsistencyValidation(); return { vocabulary_validation: result.vocabulary_validation }; }
export async function crossReferenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSpecificationIntegrityConsistencyValidation(); return { cross_reference_validation: result.cross_reference_validation }; }
export async function semanticRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSpecificationIntegrityConsistencyValidation(); return { semantic_integrity: result.semantic_integrity }; }
export async function constitutionalRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSpecificationIntegrityConsistencyValidation(); return { constitutional_consistency: result.constitutional_consistency }; }
export async function lifecycleRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSpecificationIntegrityConsistencyValidation(); return { lifecycle_consistency: result.lifecycle_consistency }; }
export async function dependencyRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSpecificationIntegrityConsistencyValidation(); return { dependency_consistency: result.dependency_consistency }; }
export async function replayCertificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSpecificationIntegrityConsistencyValidation(); return { replay_certification_consistency: result.replay_certification_consistency, replay_hash: result.replay_hash }; }
export async function taxonomyRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSpecificationIntegrityConsistencyValidation(); return { document_taxonomy_consistency: result.document_taxonomy_consistency }; }
export async function registryRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSpecificationIntegrityConsistencyValidation(); return { integrity_registry: result.integrity_registry }; }
export async function ledgerRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSpecificationIntegrityConsistencyValidation(); return { integrity_ledger: result.integrity_ledger }; }
export async function validateRequest(request: Request) { return validateSpecificationIntegrityConsistencyValidation(resultFromBody(await readBody(request))); }
