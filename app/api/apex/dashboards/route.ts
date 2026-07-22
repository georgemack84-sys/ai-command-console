import { apiError, apiSuccess } from "@/src/server/api/response";
import { dashboardsRequest, requireApexUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireApexUser(); return apiSuccess(await dashboardsRequest()); } catch (error) { return apiError(error, "Unable to inspect APEX dashboards."); } }
export async function POST(request: Request) { try { await requireApexUser(); return apiSuccess(await dashboardsRequest(request)); } catch (error) { return apiError(error, "Unable to inspect APEX dashboards."); } }
