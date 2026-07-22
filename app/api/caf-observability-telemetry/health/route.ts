import { apiError, apiSuccess } from "@/src/server/api/response";
import { healthRequest, requireObservabilityTelemetryUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireObservabilityTelemetryUser(); return apiSuccess(await healthRequest()); } catch (error) { return apiError(error, "Unable to inspect CAF health."); } }
export async function POST(request: Request) { try { await requireObservabilityTelemetryUser(); return apiSuccess(await healthRequest(request)); } catch (error) { return apiError(error, "Unable to inspect CAF health."); } }
