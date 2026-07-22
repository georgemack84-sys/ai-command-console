import { getProvingEnvironmentIdentityIsolationProvisioningBundle, runProvingEnvironmentIdentityIsolationProvisioning, validateProvingEnvironmentIdentityIsolationProvisioning } from "@/services/proving-environment-identity-isolation-provisioning";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { ProvingProvisioningInput, ProvingProvisioningResult } from "@/types/proving-environment-identity-isolation-provisioning";

export async function requireProvingProvisioningUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): ProvingProvisioningInput { return body as ProvingProvisioningInput; }
function resultFromBody(body: Record<string, unknown>): ProvingProvisioningResult { return (body.result as ProvingProvisioningResult | undefined) ?? runProvingEnvironmentIdentityIsolationProvisioning(inputFromBody(body)); }
export function contractResponse() { return getProvingEnvironmentIdentityIsolationProvisioningBundle(); }
export async function validateRequest(request: Request) { return validateProvingEnvironmentIdentityIsolationProvisioning(resultFromBody(await readBody(request))); }
export async function environmentRegistryRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingEnvironmentIdentityIsolationProvisioning(); return { environment_identity: result.environment_identity, environment_registry: result.environment_registry }; }
export async function identityRegistryRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingEnvironmentIdentityIsolationProvisioning(); return { identity_registry: result.identity_registry }; }
export async function isolationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingEnvironmentIdentityIsolationProvisioning(); return { isolation_policy: result.isolation_policy }; }
export async function provisioningRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingEnvironmentIdentityIsolationProvisioning(); return { provisioning_pipeline: result.provisioning_pipeline }; }
export async function lifecycleRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingEnvironmentIdentityIsolationProvisioning(); return { lifecycle: result.lifecycle }; }
export async function retirementRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingEnvironmentIdentityIsolationProvisioning(); return { retirement: result.retirement }; }
export async function lineageRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingEnvironmentIdentityIsolationProvisioning(); return { lineage: result.lineage }; }
export async function verificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingEnvironmentIdentityIsolationProvisioning(); return { verification: result.verification, invariants: result.invariants }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingEnvironmentIdentityIsolationProvisioning(); return { readiness: result.readiness, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
