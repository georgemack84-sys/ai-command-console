import { apiError, apiSuccess } from "@/src/server/api/response";
import { cyclesRequest, requireStrategicOperationsUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireStrategicOperationsUser(); return apiSuccess(await cyclesRequest()); } catch (error) { return apiError(error, "Unable to inspect cycle operations."); } }
export async function POST(request: Request) { try { await requireStrategicOperationsUser(); return apiSuccess(await cyclesRequest(request)); } catch (error) { return apiError(error, "Unable to inspect cycle operations."); } }
