import { apiError, apiSuccess } from "@/src/server/api/response";
import { metricsRequest, requireObservabilityTelemetryUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireObservabilityTelemetryUser(); return apiSuccess(await metricsRequest()); } catch (error) { return apiError(error, "Unable to inspect CAF metrics."); } }
export async function POST(request: Request) { try { await requireObservabilityTelemetryUser(); return apiSuccess(await metricsRequest(request)); } catch (error) { return apiError(error, "Unable to inspect CAF metrics."); } }
