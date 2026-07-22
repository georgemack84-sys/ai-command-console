import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireGovernanceAuthorityPolicyUser, warningsRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireGovernanceAuthorityPolicyUser(); return apiSuccess(await warningsRequest()); } catch (error) { return apiError(error, "Unable to inspect CAF governance warnings."); } }
export async function POST(request: Request) { try { await requireGovernanceAuthorityPolicyUser(); return apiSuccess(await warningsRequest(request)); } catch (error) { return apiError(error, "Unable to inspect CAF governance warnings."); } }
