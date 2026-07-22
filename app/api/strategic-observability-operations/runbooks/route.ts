import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireStrategicOperationsUser, runbooksRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireStrategicOperationsUser(); return apiSuccess(await runbooksRequest()); } catch (error) { return apiError(error, "Unable to inspect strategic runbooks."); } }
export async function POST(request: Request) { try { await requireStrategicOperationsUser(); return apiSuccess(await runbooksRequest(request)); } catch (error) { return apiError(error, "Unable to inspect strategic runbooks."); } }
