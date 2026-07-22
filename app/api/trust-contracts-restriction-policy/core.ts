import { getTrustContractsRestrictionPolicyBundle, runTrustContractsRestrictionPolicy, validateTrustContractsRestrictionPolicy } from "@/services/trust-contracts-restriction-policy";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { TrustContractRestrictionPolicyInput, TrustContractRestrictionPolicyResult } from "@/types/trust-contracts-restriction-policy";

export async function requireTrustContractRestrictionPolicyUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): TrustContractRestrictionPolicyInput { return body as TrustContractRestrictionPolicyInput; }
function resultFromBody(body: Record<string, unknown>): TrustContractRestrictionPolicyResult { return (body.result as TrustContractRestrictionPolicyResult | undefined) ?? runTrustContractsRestrictionPolicy(inputFromBody(body)); }
export function contractResponse() { return getTrustContractsRestrictionPolicyBundle(); }
export async function validateRequest(request: Request) { return validateTrustContractsRestrictionPolicy(resultFromBody(await readBody(request))); }
export async function trustContractRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustContractsRestrictionPolicy(); return { trust_contract: result.trust_contract }; }
export async function policyRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustContractsRestrictionPolicy(); return { standing_policy: result.standing_policy }; }
export async function matrixRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustContractsRestrictionPolicy(); return { standing_matrix: result.standing_matrix }; }
export async function compositionRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustContractsRestrictionPolicy(); return { precedence: result.precedence, composition: result.composition, effective_restrictions: result.effective_restrictions }; }
export async function exceptionsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustContractsRestrictionPolicy(); return { exception_governance: result.exception_governance }; }
export async function registriesRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustContractsRestrictionPolicy(); return { registries: result.registries }; }
export async function assuranceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustContractsRestrictionPolicy(); return { governance: result.governance, evidence_replay: result.evidence_replay, security_observability: result.security_observability, boundary: result.boundary }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustContractsRestrictionPolicy(); return { certification: result.certification, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
