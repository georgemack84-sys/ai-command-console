import { apiError, apiSuccess } from "@/src/server/api/response";
import { observabilityRequest, requireGovernanceEnforcementUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireGovernanceEnforcementUser(); return apiSuccess(await observabilityRequest()); } catch (error) { return apiError(error, "Unable to inspect governance observability."); } }
export async function POST(request: Request) { try { await requireGovernanceEnforcementUser(); return apiSuccess(await observabilityRequest(request)); } catch (error) { return apiError(error, "Unable to run governance observability."); } }
