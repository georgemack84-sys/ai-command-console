import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireObservabilityTelemetryUser, tracesRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireObservabilityTelemetryUser(); return apiSuccess(await tracesRequest()); } catch (error) { return apiError(error, "Unable to inspect CAF traces."); } }
export async function POST(request: Request) { try { await requireObservabilityTelemetryUser(); return apiSuccess(await tracesRequest(request)); } catch (error) { return apiError(error, "Unable to inspect CAF traces."); } }
