import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireObservabilityTelemetryUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireObservabilityTelemetryUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to inspect CAF observability telemetry contract."); } }
