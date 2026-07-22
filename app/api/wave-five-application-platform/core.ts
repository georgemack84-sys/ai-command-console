import { getWaveFiveApplicationPlatformBundle, runWaveFiveApplicationPlatform, validateWaveFiveApplicationPlatform } from "@/services/wave-five-application-platform";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { WaveFiveApplicationPlatformInput, WaveFiveApplicationPlatformResult } from "@/types/wave-five-application-platform";

export async function requireWaveFiveApplicationPlatformUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): WaveFiveApplicationPlatformInput { return body as WaveFiveApplicationPlatformInput; }
function resultFromBody(body: Record<string, unknown>): WaveFiveApplicationPlatformResult { return (body.result as WaveFiveApplicationPlatformResult | undefined) ?? runWaveFiveApplicationPlatform(inputFromBody(body)); }
export function contractResponse() { return getWaveFiveApplicationPlatformBundle(); }
export async function validateRequest(request: Request) { return validateWaveFiveApplicationPlatform(resultFromBody(await readBody(request))); }
export async function architectureRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveApplicationPlatform(); return { architecture: result.architecture }; }
export async function shellRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveApplicationPlatform(); return { shell: result.shell }; }
export async function navigationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveApplicationPlatform(); return { navigation: result.navigation }; }
export async function searchRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveApplicationPlatform(); return { search: result.search }; }
export async function componentsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveApplicationPlatform(); return { components: result.components }; }
export async function sdkRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveApplicationPlatform(); return { sdk: result.sdk }; }
export async function gatewayRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveApplicationPlatform(); return { gateway: result.gateway }; }
export async function notificationsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveApplicationPlatform(); return { notifications: result.notifications }; }
export async function permissionsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveApplicationPlatform(); return { permissions: result.permissions }; }
export async function commandsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveApplicationPlatform(); return { commands: result.commands }; }
export async function evidenceTelemetryRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveApplicationPlatform(); return { evidence_telemetry: result.evidence_telemetry }; }
export async function developerExperienceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveApplicationPlatform(); return { developer_experience: result.developer_experience }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveApplicationPlatform(); return { readiness: result.readiness, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
