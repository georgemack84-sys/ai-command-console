import {
  buildHiddenCommunicationAnalysis,
  buildHiddenCommunicationObservabilitySurface,
  detectHiddenCommunication,
  detectSideChannel,
  generateCommunicationReport,
  getHiddenCommunicationDetection,
  registerMessage,
  validateChannel,
  validateHiddenCommunication,
  validatePermission,
  verifyMessageLineage,
} from "@/services/hidden-communication-detection";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { HiddenCommunicationAnalysis, HiddenCommunicationInput } from "@/types/hidden-communication-detection";

export async function requireHiddenCommunicationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function analysisFromBody(body: Record<string, unknown>): HiddenCommunicationAnalysis {
  return (body.analysis as HiddenCommunicationAnalysis | undefined) ?? buildHiddenCommunicationAnalysis(body as HiddenCommunicationInput);
}

export function contractResponse() { return getHiddenCommunicationDetection(); }
export async function validateChannelRequest(request: Request) { return validateChannel((await readBody(request)) as HiddenCommunicationInput); }
export async function validatePermissionRequest(request: Request) { return validatePermission((await readBody(request)) as HiddenCommunicationInput); }
export async function registerMessageRequest(request: Request) { return registerMessage((await readBody(request)) as HiddenCommunicationInput); }
export async function verifyLineageRequest(request: Request) { return verifyMessageLineage((await readBody(request)) as HiddenCommunicationInput); }
export async function detectHiddenRequest(request: Request) { return detectHiddenCommunication((await readBody(request)) as HiddenCommunicationInput); }
export async function detectSideChannelRequest(request: Request) { return detectSideChannel((await readBody(request)) as HiddenCommunicationInput); }
export async function reportRequest(request: Request) { return generateCommunicationReport((await readBody(request)) as HiddenCommunicationInput); }
export async function validateRequest(request: Request) { return validateHiddenCommunication(analysisFromBody(await readBody(request))); }
export async function inspectRequest(request?: Request) {
  if (!request) return buildHiddenCommunicationObservabilitySurface();
  return buildHiddenCommunicationObservabilitySurface(analysisFromBody(await readBody(request)));
}
