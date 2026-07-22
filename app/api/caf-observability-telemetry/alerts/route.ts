import { alertsRequest, requireObservabilityTelemetryUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireObservabilityTelemetryUser(); return apiSuccess(await alertsRequest()); } catch (error) { return apiError(error, "Unable to inspect CAF alerts."); } }
export async function POST(request: Request) { try { await requireObservabilityTelemetryUser(); return apiSuccess(await alertsRequest(request)); } catch (error) { return apiError(error, "Unable to inspect CAF alerts."); } }
