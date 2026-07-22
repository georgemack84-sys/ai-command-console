import { apiError, apiSuccess } from "@/src/server/api/response";
import { federationRequest, requireCollaborationFederationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireCollaborationFederationUser(); return apiSuccess(await federationRequest()); } catch (error) { return apiError(error, "Unable to inspect CAF federation."); } }
export async function POST(request: Request) { try { await requireCollaborationFederationUser(); return apiSuccess(await federationRequest(request)); } catch (error) { return apiError(error, "Unable to inspect CAF federation."); } }
