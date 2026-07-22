import { getWaveFivePlatformBridgeGatewayBundle, runWaveFivePlatformBridgeGateway, validateWaveFivePlatformBridgeGateway } from "@/services/wave-five-platform-bridge-gateway";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { WaveFivePlatformBridgeGatewayInput, WaveFivePlatformBridgeGatewayResult } from "@/types/wave-five-platform-bridge-gateway";

export async function requireWaveFivePlatformBridgeGatewayUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): WaveFivePlatformBridgeGatewayInput { return body as WaveFivePlatformBridgeGatewayInput; }
function resultFromBody(body: Record<string, unknown>): WaveFivePlatformBridgeGatewayResult { return (body.result as WaveFivePlatformBridgeGatewayResult | undefined) ?? runWaveFivePlatformBridgeGateway(inputFromBody(body)); }
export function contractResponse() { return getWaveFivePlatformBridgeGatewayBundle(); }
export async function validateRequest(request: Request) { return validateWaveFivePlatformBridgeGateway(resultFromBody(await readBody(request))); }
export async function externalConnectionsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFivePlatformBridgeGateway(); return { external_connections: result.external_connections }; }
export async function registryContractsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFivePlatformBridgeGateway(); return { registry_contracts: result.registry_contracts }; }
export async function configurationQualificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFivePlatformBridgeGateway(); return { configuration_qualification: result.configuration_qualification }; }
export async function eligibilityLifecycleGovernanceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFivePlatformBridgeGateway(); return { eligibility_lifecycle_governance: result.eligibility_lifecycle_governance }; }
export async function evidenceAdminRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFivePlatformBridgeGateway(); return { evidence_admin: result.evidence_admin }; }
export async function boundaryRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFivePlatformBridgeGateway(); return { boundary: result.boundary }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFivePlatformBridgeGateway(); return { readiness: result.readiness, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
