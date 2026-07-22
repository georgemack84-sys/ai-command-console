import { apiError, apiSuccess } from "@/src/server/api/response";
import { policyRequest, requireTrustContractRestrictionPolicyUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustContractRestrictionPolicyUser(); return apiSuccess(await policyRequest()); } catch (error) { return apiError(error, "Unable to inspect standing restriction policy."); } }
export async function POST(request: Request) { try { await requireTrustContractRestrictionPolicyUser(); return apiSuccess(await policyRequest(request)); } catch (error) { return apiError(error, "Unable to project standing restriction policy."); } }
