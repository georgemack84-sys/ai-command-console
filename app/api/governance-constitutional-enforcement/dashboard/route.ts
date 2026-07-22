import { apiError, apiSuccess } from "@/src/server/api/response";
import { dashboardRequest, requireGovernanceEnforcementUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireGovernanceEnforcementUser(); return apiSuccess(await dashboardRequest()); } catch (error) { return apiError(error, "Unable to inspect governance constitutional enforcement."); } }
export async function POST(request: Request) { try { await requireGovernanceEnforcementUser(); return apiSuccess(await dashboardRequest(request)); } catch (error) { return apiError(error, "Unable to run governance constitutional enforcement."); } }
