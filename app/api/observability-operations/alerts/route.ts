import { apiError, apiSuccess } from "@/src/server/api/response";
import { alertsRequest, requireObservabilityOperationsUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireObservabilityOperationsUser(); return apiSuccess(await alertsRequest()); } catch (error) { return apiError(error, "Unable to load observability alerts."); } }
export async function POST(request: Request) { try { await requireObservabilityOperationsUser(); return apiSuccess(await alertsRequest(request)); } catch (error) { return apiError(error, "Unable to load observability alerts."); } }
