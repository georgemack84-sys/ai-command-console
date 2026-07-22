import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireLiveTenantIsolationUser, resultRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireLiveTenantIsolationUser(); return apiSuccess(await resultRequest()); } catch (error) { return apiError(error, "Unable to run live tenant isolation qualification."); } }
export async function POST(request: Request) { try { await requireLiveTenantIsolationUser(); return apiSuccess(await resultRequest(request)); } catch (error) { return apiError(error, "Unable to run live tenant isolation qualification."); } }
