import { apiError, apiSuccess } from "@/src/server/api/response";
import { assuranceRequest, requireTrustContractRestrictionPolicyUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustContractRestrictionPolicyUser(); return apiSuccess(await assuranceRequest()); } catch (error) { return apiError(error, "Unable to inspect restriction policy assurance."); } }
export async function POST(request: Request) { try { await requireTrustContractRestrictionPolicyUser(); return apiSuccess(await assuranceRequest(request)); } catch (error) { return apiError(error, "Unable to project restriction policy assurance."); } }
