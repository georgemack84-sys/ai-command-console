import { apiError, apiSuccess } from "@/src/server/api/response";
import { collaborationRequest, requireCollaborationFederationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireCollaborationFederationUser(); return apiSuccess(await collaborationRequest()); } catch (error) { return apiError(error, "Unable to inspect CAF collaboration framework."); } }
export async function POST(request: Request) { try { await requireCollaborationFederationUser(); return apiSuccess(await collaborationRequest(request)); } catch (error) { return apiError(error, "Unable to inspect CAF collaboration framework."); } }
