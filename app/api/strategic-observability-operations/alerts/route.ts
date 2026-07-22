import { apiError, apiSuccess } from "@/src/server/api/response";
import { alertsRequest, requireStrategicOperationsUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireStrategicOperationsUser(); return apiSuccess(await alertsRequest()); } catch (error) { return apiError(error, "Unable to inspect strategic alerts."); } }
export async function POST(request: Request) { try { await requireStrategicOperationsUser(); return apiSuccess(await alertsRequest(request)); } catch (error) { return apiError(error, "Unable to inspect strategic alerts."); } }
