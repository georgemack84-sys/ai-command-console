import { apiError, apiSuccess } from "@/src/server/api/response";
import { dashboardRequest, requireStrategicOperationsUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireStrategicOperationsUser(); return apiSuccess(await dashboardRequest()); } catch (error) { return apiError(error, "Unable to inspect strategic operations dashboard."); } }
export async function POST(request: Request) { try { await requireStrategicOperationsUser(); return apiSuccess(await dashboardRequest(request)); } catch (error) { return apiError(error, "Unable to inspect strategic operations dashboard."); } }
