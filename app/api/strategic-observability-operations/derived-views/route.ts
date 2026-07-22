import { apiError, apiSuccess } from "@/src/server/api/response";
import { derivedViewsRequest, requireStrategicOperationsUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireStrategicOperationsUser(); return apiSuccess(await derivedViewsRequest()); } catch (error) { return apiError(error, "Unable to inspect derived strategic views."); } }
export async function POST(request: Request) { try { await requireStrategicOperationsUser(); return apiSuccess(await derivedViewsRequest(request)); } catch (error) { return apiError(error, "Unable to inspect derived strategic views."); } }
