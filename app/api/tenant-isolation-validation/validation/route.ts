import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireTenantIsolationValidationUser, validationRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTenantIsolationValidationUser(); return apiSuccess(await validationRequest()); } catch (error) { return apiError(error, "Unable to load tenant isolation validation record."); } }
export async function POST(request: Request) { try { await requireTenantIsolationValidationUser(); return apiSuccess(await validationRequest(request)); } catch (error) { return apiError(error, "Unable to load tenant isolation validation record."); } }
