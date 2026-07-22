import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireTrustMonitoringUser, trendsRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustMonitoringUser(); return apiSuccess(await trendsRequest()); } catch (error) { return apiError(error, "Unable to load Trust Monitoring trends."); } }
export async function POST(request: Request) { try { await requireTrustMonitoringUser(); return apiSuccess(await trendsRequest(request)); } catch (error) { return apiError(error, "Unable to evaluate Trust Monitoring trends."); } }
