import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireDashboardSecurityUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireDashboardSecurityUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to retrieve dashboard security contract."); } }
