import { apiError, apiSuccess } from "@/src/server/api/response";
import { certificationRequest, requireLiveTenantIsolationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireLiveTenantIsolationUser(); return apiSuccess(await certificationRequest()); } catch (error) { return apiError(error, "Unable to load live tenant isolation certification."); } }
export async function POST(request: Request) { try { await requireLiveTenantIsolationUser(); return apiSuccess(await certificationRequest(request)); } catch (error) { return apiError(error, "Unable to load live tenant isolation certification."); } }
