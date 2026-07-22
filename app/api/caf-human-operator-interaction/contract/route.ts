import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireHumanOperatorInteractionUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireHumanOperatorInteractionUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to inspect CAF human operator interaction contract."); } }
