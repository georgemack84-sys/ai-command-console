import { apiError, apiSuccess } from "@/src/server/api/response";
import { gateRequest, requireGovernanceAuthorityPolicyUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireGovernanceAuthorityPolicyUser(); return apiSuccess(await gateRequest()); } catch (error) { return apiError(error, "Unable to inspect CAF gate result."); } }
export async function POST(request: Request) { try { await requireGovernanceAuthorityPolicyUser(); return apiSuccess(await gateRequest(request)); } catch (error) { return apiError(error, "Unable to inspect CAF gate result."); } }
