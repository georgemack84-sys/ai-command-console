import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireObservabilityOperationsUser, runbooksRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireObservabilityOperationsUser(); return apiSuccess(await runbooksRequest()); } catch (error) { return apiError(error, "Unable to load observability runbooks."); } }
export async function POST(request: Request) { try { await requireObservabilityOperationsUser(); return apiSuccess(await runbooksRequest(request)); } catch (error) { return apiError(error, "Unable to load observability runbooks."); } }
