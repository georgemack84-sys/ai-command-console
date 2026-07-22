import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireDashboardObservabilityUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireDashboardObservabilityUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to retrieve dashboard observability contract."); } }
