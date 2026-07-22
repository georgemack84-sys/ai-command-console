import { apiError, apiSuccess } from "@/src/server/api/response";
import { delegationRequest, requireCollaborationFederationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireCollaborationFederationUser(); return apiSuccess(await delegationRequest()); } catch (error) { return apiError(error, "Unable to inspect CAF delegation and negotiation."); } }
export async function POST(request: Request) { try { await requireCollaborationFederationUser(); return apiSuccess(await delegationRequest(request)); } catch (error) { return apiError(error, "Unable to inspect CAF delegation and negotiation."); } }
