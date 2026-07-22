import { apiError, apiSuccess } from "@/src/server/api/response";
import { dashboardRequest, requireTrustMonitoringUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustMonitoringUser(); return apiSuccess(await dashboardRequest()); } catch (error) { return apiError(error, "Unable to load Trust Monitoring dashboard."); } }
export async function POST(request: Request) { try { await requireTrustMonitoringUser(); return apiSuccess(await dashboardRequest(request)); } catch (error) { return apiError(error, "Unable to evaluate Trust Monitoring dashboard."); } }
