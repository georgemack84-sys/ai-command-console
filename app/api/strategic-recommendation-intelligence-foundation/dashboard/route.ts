import { apiError, apiSuccess } from "@/src/server/api/response";
import { dashboardRequest, requireStrategicFoundationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireStrategicFoundationUser(); return apiSuccess(await dashboardRequest()); } catch (error) { return apiError(error, "Unable to inspect strategic recommendation intelligence foundation."); } }
export async function POST(request: Request) { try { await requireStrategicFoundationUser(); return apiSuccess(await dashboardRequest(request)); } catch (error) { return apiError(error, "Unable to run strategic recommendation intelligence foundation."); } }
