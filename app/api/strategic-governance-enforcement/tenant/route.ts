import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireStrategicGovernanceUser, tenantRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireStrategicGovernanceUser(); return apiSuccess(await tenantRequest()); } catch (error) { return apiError(error, "Unable to validate strategic tenant isolation."); } }
export async function POST(request: Request) { try { await requireStrategicGovernanceUser(); return apiSuccess(await tenantRequest(request)); } catch (error) { return apiError(error, "Unable to validate strategic tenant isolation."); } }
