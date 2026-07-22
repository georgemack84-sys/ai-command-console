import { apiError, apiSuccess } from "@/src/server/api/response";
import { manifestsRequest, requireStrategicOperationsUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireStrategicOperationsUser(); return apiSuccess(await manifestsRequest()); } catch (error) { return apiError(error, "Unable to inspect manifest operations."); } }
export async function POST(request: Request) { try { await requireStrategicOperationsUser(); return apiSuccess(await manifestsRequest(request)); } catch (error) { return apiError(error, "Unable to inspect manifest operations."); } }
