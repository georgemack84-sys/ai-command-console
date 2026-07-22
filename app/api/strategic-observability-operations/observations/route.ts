import { apiError, apiSuccess } from "@/src/server/api/response";
import { observationsRequest, requireStrategicOperationsUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireStrategicOperationsUser(); return apiSuccess(await observationsRequest()); } catch (error) { return apiError(error, "Unable to inspect observation operations."); } }
export async function POST(request: Request) { try { await requireStrategicOperationsUser(); return apiSuccess(await observationsRequest(request)); } catch (error) { return apiError(error, "Unable to inspect observation operations."); } }
