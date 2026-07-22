import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requirePbgUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requirePbgUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to inspect PBG contract."); } }
