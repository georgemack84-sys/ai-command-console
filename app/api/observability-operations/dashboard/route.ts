import { apiError, apiSuccess } from "@/src/server/api/response";
import { dashboardRequest, requireObservabilityOperationsUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireObservabilityOperationsUser(); return apiSuccess(await dashboardRequest()); } catch (error) { return apiError(error, "Unable to load observability dashboard."); } }
export async function POST(request: Request) { try { await requireObservabilityOperationsUser(); return apiSuccess(await dashboardRequest(request)); } catch (error) { return apiError(error, "Unable to load observability dashboard."); } }
