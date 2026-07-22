import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireStrategicOperationsUser, tenantRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireStrategicOperationsUser(); return apiSuccess(await tenantRequest()); } catch (error) { return apiError(error, "Unable to inspect tenant operations."); } }
export async function POST(request: Request) { try { await requireStrategicOperationsUser(); return apiSuccess(await tenantRequest(request)); } catch (error) { return apiError(error, "Unable to inspect tenant operations."); } }
