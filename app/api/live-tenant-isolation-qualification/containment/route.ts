import { apiError, apiSuccess } from "@/src/server/api/response";
import { containmentRequest, requireLiveTenantIsolationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireLiveTenantIsolationUser(); return apiSuccess(await containmentRequest()); } catch (error) { return apiError(error, "Unable to load tenant containment recommendation."); } }
export async function POST(request: Request) { try { await requireLiveTenantIsolationUser(); return apiSuccess(await containmentRequest(request)); } catch (error) { return apiError(error, "Unable to load tenant containment recommendation."); } }
