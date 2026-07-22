import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireCollaborationFederationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireCollaborationFederationUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to inspect CAF collaboration federation contract."); } }
