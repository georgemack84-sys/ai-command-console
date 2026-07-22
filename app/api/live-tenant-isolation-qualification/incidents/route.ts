import { apiError, apiSuccess } from "@/src/server/api/response";
import { incidentsRequest, requireLiveTenantIsolationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireLiveTenantIsolationUser(); return apiSuccess(await incidentsRequest()); } catch (error) { return apiError(error, "Unable to load isolation incidents."); } }
export async function POST(request: Request) { try { await requireLiveTenantIsolationUser(); return apiSuccess(await incidentsRequest(request)); } catch (error) { return apiError(error, "Unable to load isolation incidents."); } }
