import { apiError, apiSuccess } from "@/src/server/api/response";
import { readinessRequest, requireTrustMonitoringUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustMonitoringUser(); return apiSuccess(await readinessRequest()); } catch (error) { return apiError(error, "Unable to load Trust Continuous Monitoring readiness."); } }
export async function POST(request: Request) { try { await requireTrustMonitoringUser(); return apiSuccess(await readinessRequest(request)); } catch (error) { return apiError(error, "Unable to evaluate Trust Continuous Monitoring readiness."); } }
