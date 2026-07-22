import { apiError, apiSuccess } from "@/src/server/api/response";
import { healthRequest, requireTrustMonitoringUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustMonitoringUser(); return apiSuccess(await healthRequest()); } catch (error) { return apiError(error, "Unable to load Trust Health report."); } }
export async function POST(request: Request) { try { await requireTrustMonitoringUser(); return apiSuccess(await healthRequest(request)); } catch (error) { return apiError(error, "Unable to evaluate Trust Health report."); } }
