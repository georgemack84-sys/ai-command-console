import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireStevnUser, securityRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET(request: Request) { try { await requireStevnUser(); return apiSuccess(await securityRequest(request)); } catch (error) { return apiError(error, "Unable to inspect STEVN Application security."); } }
