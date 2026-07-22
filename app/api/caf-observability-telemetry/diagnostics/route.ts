import { apiError, apiSuccess } from "@/src/server/api/response";
import { diagnosticsRequest, requireObservabilityTelemetryUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireObservabilityTelemetryUser(); return apiSuccess(await diagnosticsRequest()); } catch (error) { return apiError(error, "Unable to inspect CAF diagnostics."); } }
export async function POST(request: Request) { try { await requireObservabilityTelemetryUser(); return apiSuccess(await diagnosticsRequest(request)); } catch (error) { return apiError(error, "Unable to inspect CAF diagnostics."); } }
