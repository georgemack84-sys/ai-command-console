import { alertsRequest, requireTrustMonitoringUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustMonitoringUser(); return apiSuccess(await alertsRequest()); } catch (error) { return apiError(error, "Unable to load Trust Monitoring alerts."); } }
export async function POST(request: Request) { try { await requireTrustMonitoringUser(); return apiSuccess(await alertsRequest(request)); } catch (error) { return apiError(error, "Unable to generate Trust Monitoring alerts."); } }
