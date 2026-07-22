import { apiError, apiSuccess } from "@/src/server/api/response";
import { dashboardsRequest, requireQciUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireQciUser(); return apiSuccess(await dashboardsRequest()); } catch (error) { return apiError(error, "Unable to inspect QCI dashboards."); } }
export async function POST(request: Request) { try { await requireQciUser(); return apiSuccess(await dashboardsRequest(request)); } catch (error) { return apiError(error, "Unable to inspect QCI dashboards."); } }
