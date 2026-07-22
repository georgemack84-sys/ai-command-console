import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireScaleStressResilienceUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireScaleStressResilienceUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to load scale stress resilience contract."); } }
