import { apiError, apiSuccess } from "@/src/server/api/response";
import { approvalsRequest, requireGovernanceEnforcementUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireGovernanceEnforcementUser(); return apiSuccess(await approvalsRequest()); } catch (error) { return apiError(error, "Unable to inspect governance approvals."); } }
export async function POST(request: Request) { try { await requireGovernanceEnforcementUser(); return apiSuccess(await approvalsRequest(request)); } catch (error) { return apiError(error, "Unable to run governance approvals."); } }
