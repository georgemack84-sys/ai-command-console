import { apiError, apiSuccess } from "@/src/server/api/response";
import { certificationRequest, requireTenantIsolationValidationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTenantIsolationValidationUser(); return apiSuccess(await certificationRequest()); } catch (error) { return apiError(error, "Unable to load tenant isolation certification."); } }
export async function POST(request: Request) { try { await requireTenantIsolationValidationUser(); return apiSuccess(await certificationRequest(request)); } catch (error) { return apiError(error, "Unable to load tenant isolation certification."); } }
