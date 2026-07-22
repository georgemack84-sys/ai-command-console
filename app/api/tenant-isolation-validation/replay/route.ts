import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayRequest, requireTenantIsolationValidationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTenantIsolationValidationUser(); return apiSuccess(await replayRequest()); } catch (error) { return apiError(error, "Unable to load tenant isolation replay."); } }
export async function POST(request: Request) { try { await requireTenantIsolationValidationUser(); return apiSuccess(await replayRequest(request)); } catch (error) { return apiError(error, "Unable to load tenant isolation replay."); } }
