import { getWaveSixProviderConsumptionFrameworkBundle, runWaveSixProviderConsumptionFramework, validateWaveSixProviderConsumptionFramework } from "@/services/wave-six-provider-consumption-framework";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { WaveSixProviderConsumptionFrameworkInput, WaveSixProviderConsumptionFrameworkResult } from "@/types/wave-six-provider-consumption-framework";

export async function requireWaveSixProviderConsumptionFrameworkUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): WaveSixProviderConsumptionFrameworkInput { return body as WaveSixProviderConsumptionFrameworkInput; }
function resultFromBody(body: Record<string, unknown>): WaveSixProviderConsumptionFrameworkResult { return (body.result as WaveSixProviderConsumptionFrameworkResult | undefined) ?? runWaveSixProviderConsumptionFramework(inputFromBody(body)); }
export function contractResponse() { return getWaveSixProviderConsumptionFrameworkBundle(); }
export async function validateRequest(request: Request) { return validateWaveSixProviderConsumptionFramework(resultFromBody(await readBody(request))); }
export async function providerDiscoveryRegistryRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveSixProviderConsumptionFramework(); return { provider_discovery_registry: result.provider_discovery_registry }; }
export async function consumerContractRegistryRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveSixProviderConsumptionFramework(); return { consumer_contract_registry: result.consumer_contract_registry }; }
export async function canonicalVersionCompatibilityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveSixProviderConsumptionFramework(); return { canonical_version_compatibility: result.canonical_version_compatibility }; }
export async function consumptionPolicyFailureReplayRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveSixProviderConsumptionFramework(); return { consumption_policy_failure_replay: result.consumption_policy_failure_replay }; }
export async function dependencyValidationGovernanceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveSixProviderConsumptionFramework(); return { dependency_validation_governance: result.dependency_validation_governance }; }
export async function providerOwnershipBoundaryRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveSixProviderConsumptionFramework(); return { provider_ownership_boundary: result.provider_ownership_boundary }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveSixProviderConsumptionFramework(); return { readiness: result.readiness, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
