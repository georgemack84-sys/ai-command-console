import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireTrustContractRestrictionPolicyUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustContractRestrictionPolicyUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to inspect Trust Contracts & Restriction Policy contract."); } }
