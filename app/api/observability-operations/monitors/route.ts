import { apiError, apiSuccess } from "@/src/server/api/response";
import { monitorsRequest, requireObservabilityOperationsUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireObservabilityOperationsUser(); return apiSuccess(await monitorsRequest()); } catch (error) { return apiError(error, "Unable to load observability monitors."); } }
export async function POST(request: Request) { try { await requireObservabilityOperationsUser(); return apiSuccess(await monitorsRequest(request)); } catch (error) { return apiError(error, "Unable to load observability monitors."); } }
