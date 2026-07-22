import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireObservabilityTelemetryUser, telemetryRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireObservabilityTelemetryUser(); return apiSuccess(await telemetryRequest()); } catch (error) { return apiError(error, "Unable to inspect CAF telemetry."); } }
export async function POST(request: Request) { try { await requireObservabilityTelemetryUser(); return apiSuccess(await telemetryRequest(request)); } catch (error) { return apiError(error, "Unable to inspect CAF telemetry."); } }
