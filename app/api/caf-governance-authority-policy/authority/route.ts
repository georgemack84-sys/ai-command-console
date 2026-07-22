import { apiError, apiSuccess } from "@/src/server/api/response";
import { authorityRequest, requireGovernanceAuthorityPolicyUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireGovernanceAuthorityPolicyUser(); return apiSuccess(await authorityRequest()); } catch (error) { return apiError(error, "Unable to inspect CAF authority decision."); } }
export async function POST(request: Request) { try { await requireGovernanceAuthorityPolicyUser(); return apiSuccess(await authorityRequest(request)); } catch (error) { return apiError(error, "Unable to inspect CAF authority decision."); } }
