import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireTrustMonitoringUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustMonitoringUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to load Trust Continuous Monitoring contract."); } }
