import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireMissionControlUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireMissionControlUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to inspect Mission Control contract."); } }
