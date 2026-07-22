import { apiError, apiSuccess } from "@/src/server/api/response";
import { monitorRequest, requireLiveTenantIsolationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireLiveTenantIsolationUser(); return apiSuccess(await monitorRequest()); } catch (error) { return apiError(error, "Unable to load live isolation monitor."); } }
export async function POST(request: Request) { try { await requireLiveTenantIsolationUser(); return apiSuccess(await monitorRequest(request)); } catch (error) { return apiError(error, "Unable to load live isolation monitor."); } }
