import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireTenantIsolationValidationUser, resultRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTenantIsolationValidationUser(); return apiSuccess(await resultRequest()); } catch (error) { return apiError(error, "Unable to run tenant isolation validation."); } }
export async function POST(request: Request) { try { await requireTenantIsolationValidationUser(); return apiSuccess(await resultRequest(request)); } catch (error) { return apiError(error, "Unable to run tenant isolation validation."); } }
