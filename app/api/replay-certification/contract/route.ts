import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireReplayCertificationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireReplayCertificationUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to retrieve replay certification contract."); } }
