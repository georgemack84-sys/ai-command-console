import { apiError, apiSuccess } from "@/src/server/api/response";
import { governanceRequest, requireTenantIsolationValidationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTenantIsolationValidationUser(); return apiSuccess(await governanceRequest()); } catch (error) { return apiError(error, "Unable to load tenant isolation governance."); } }
export async function POST(request: Request) { try { await requireTenantIsolationValidationUser(); return apiSuccess(await governanceRequest(request)); } catch (error) { return apiError(error, "Unable to load tenant isolation governance."); } }
