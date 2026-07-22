import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireProductionReadinessUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireProductionReadinessUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to retrieve production readiness certification contract."); } }
