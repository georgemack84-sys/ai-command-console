import { getConfigurationPlatformBundle, runConfigurationPlatform, validateConfigurationPlatform } from "@/services/configuration-platform";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { ConfigurationPlatformInput, ConfigurationPlatformResult } from "@/types/configuration-platform";

export async function requireConfigurationPlatformUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): ConfigurationPlatformInput { return body as ConfigurationPlatformInput; }
function resultFromBody(body: Record<string, unknown>): ConfigurationPlatformResult { return (body.result as ConfigurationPlatformResult | undefined) ?? runConfigurationPlatform(inputFromBody(body)); }
export function contractResponse() { return getConfigurationPlatformBundle(); }
export async function validateRequest(request: Request) { return validateConfigurationPlatform(resultFromBody(await readBody(request))); }
export async function architectureRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runConfigurationPlatform(); return { architecture: result.architecture }; }
export async function serviceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runConfigurationPlatform(); return { configuration_service: result.configuration_service }; }
export async function runtimeRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runConfigurationPlatform(); return { runtime_configuration: result.runtime_configuration }; }
export async function flagsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runConfigurationPlatform(); return { feature_flags: result.feature_flags }; }
export async function environmentsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runConfigurationPlatform(); return { environment_profiles: result.environment_profiles }; }
export async function configurationValidationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runConfigurationPlatform(); return { validation: result.validation }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runConfigurationPlatform(); return { evidence: result.evidence }; }
export async function qualificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runConfigurationPlatform(); return { qualification: result.qualification }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runConfigurationPlatform(); return { readiness: result.readiness, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
