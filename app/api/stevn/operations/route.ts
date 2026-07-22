import { apiError, apiSuccess } from "@/src/server/api/response";
import { operationsRequest, requireStevnUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET(request: Request) { try { await requireStevnUser(); return apiSuccess(await operationsRequest(request)); } catch (error) { return apiError(error, "Unable to inspect STEVN Application operations."); } }
