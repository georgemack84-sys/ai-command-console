import { apiError, apiSuccess } from "@/src/server/api/response";
import { detectorRequest, requireLiveTenantIsolationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireLiveTenantIsolationUser(); return apiSuccess(await detectorRequest()); } catch (error) { return apiError(error, "Unable to load cross-tenant detector."); } }
export async function POST(request: Request) { try { await requireLiveTenantIsolationUser(); return apiSuccess(await detectorRequest(request)); } catch (error) { return apiError(error, "Unable to load cross-tenant detector."); } }
