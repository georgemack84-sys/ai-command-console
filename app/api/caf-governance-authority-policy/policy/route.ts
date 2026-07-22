import { apiError, apiSuccess } from "@/src/server/api/response";
import { policyRequest, requireGovernanceAuthorityPolicyUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireGovernanceAuthorityPolicyUser(); return apiSuccess(await policyRequest()); } catch (error) { return apiError(error, "Unable to inspect CAF policy evaluation."); } }
export async function POST(request: Request) { try { await requireGovernanceAuthorityPolicyUser(); return apiSuccess(await policyRequest(request)); } catch (error) { return apiError(error, "Unable to inspect CAF policy evaluation."); } }
