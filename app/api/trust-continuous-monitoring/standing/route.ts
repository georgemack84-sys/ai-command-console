import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireTrustMonitoringUser, standingRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustMonitoringUser(); return apiSuccess(await standingRequest()); } catch (error) { return apiError(error, "Unable to load Trust Standing history."); } }
export async function POST(request: Request) { try { await requireTrustMonitoringUser(); return apiSuccess(await standingRequest(request)); } catch (error) { return apiError(error, "Unable to evaluate Trust Standing history."); } }
