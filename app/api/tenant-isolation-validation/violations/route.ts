import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireTenantIsolationValidationUser, violationsRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTenantIsolationValidationUser(); return apiSuccess(await violationsRequest()); } catch (error) { return apiError(error, "Unable to load tenant isolation violations."); } }
export async function POST(request: Request) { try { await requireTenantIsolationValidationUser(); return apiSuccess(await violationsRequest(request)); } catch (error) { return apiError(error, "Unable to load tenant isolation violations."); } }
