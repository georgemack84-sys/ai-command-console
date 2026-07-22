import { getCafConstitutionalFoundationBundle, runCafConstitutionalFoundation, validateCafConstitutionalFoundation } from "@/services/caf-constitutional-foundation";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { CafConstitutionalFoundationInput, CafConstitutionalFoundationResult } from "@/types/caf-constitutional-foundation";

export async function requireCafConstitutionalFoundationUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): CafConstitutionalFoundationInput { return body as CafConstitutionalFoundationInput; }
function resultFromBody(body: Record<string, unknown>): CafConstitutionalFoundationResult { return (body.result as CafConstitutionalFoundationResult | undefined) ?? runCafConstitutionalFoundation(inputFromBody(body)); }
export function contractResponse() { return getCafConstitutionalFoundationBundle(); }
export async function validateRequest(request: Request) { return validateCafConstitutionalFoundation(resultFromBody(await readBody(request))); }
export async function constitutionRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runCafConstitutionalFoundation(); return { constitution: result.constitution }; }
export async function doctrineRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runCafConstitutionalFoundation(); return { doctrine: result.doctrine }; }
export async function authorityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runCafConstitutionalFoundation(); return { authority_model: result.authority_model }; }
export async function invariantsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runCafConstitutionalFoundation(); return { invariants: result.invariants }; }
export async function vocabularyRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runCafConstitutionalFoundation(); return { vocabulary: result.vocabulary }; }
export async function cciContractsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runCafConstitutionalFoundation(); return { cci_contracts: result.cci_contracts }; }
export async function cataContractsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runCafConstitutionalFoundation(); return { cata_contracts: result.cata_contracts }; }
export async function cataAvailabilityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runCafConstitutionalFoundation(); return { cata_availability: result.cata_availability }; }
export async function tenantIntegrationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runCafConstitutionalFoundation(); return { tenant_integration: result.tenant_integration }; }
export async function architectureRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runCafConstitutionalFoundation(); return { architecture: result.architecture }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runCafConstitutionalFoundation(); return { evidence: result.evidence }; }
export async function namespaceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runCafConstitutionalFoundation(); return { namespace_ownership: result.tenant_integration.namespace_ownership, namespace_isolation: result.invariants.namespace_isolation, tenant_integration: result.tenant_integration }; }
export async function ownershipRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runCafConstitutionalFoundation(); return { constitutional_ownership: result.constitution.constitutional_authority, runtime_ownership_model: result.architecture.runtime_ownership_model, capability_boundary_model: result.architecture.capability_boundary_model, authority_model: result.authority_model }; }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runCafConstitutionalFoundation(); return { constitutional_approval_record: result.evidence.constitutional_approval_record, governance_evidence_package: result.evidence.governance_evidence_package, qualification_evidence: result.evidence.qualification_evidence, readiness: result.readiness }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runCafConstitutionalFoundation(); return { readiness: result.readiness, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
