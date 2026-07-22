import { apiError, apiSuccess } from "@/src/server/api/response";
import { evidenceRequest, requireTenantIsolationValidationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTenantIsolationValidationUser(); return apiSuccess(await evidenceRequest()); } catch (error) { return apiError(error, "Unable to load tenant isolation evidence."); } }
export async function POST(request: Request) { try { await requireTenantIsolationValidationUser(); return apiSuccess(await evidenceRequest(request)); } catch (error) { return apiError(error, "Unable to load tenant isolation evidence."); } }
