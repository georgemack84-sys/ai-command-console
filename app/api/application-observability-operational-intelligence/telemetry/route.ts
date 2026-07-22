import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireApplicationOperationalUser, telemetryRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireApplicationOperationalUser(); return apiSuccess(await telemetryRequest()); } catch (error) { return apiError(error, "Unable to inspect telemetry views."); } }
export async function POST(request: Request) { try { await requireApplicationOperationalUser(); return apiSuccess(await telemetryRequest(request)); } catch (error) { return apiError(error, "Unable to inspect telemetry views."); } }
