import { apiError, apiSuccess } from "@/src/server/api/response";
import { readinessRequest, requireTrustContractRestrictionPolicyUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustContractRestrictionPolicyUser(); return apiSuccess(await readinessRequest()); } catch (error) { return apiError(error, "Unable to inspect Trust Contracts & Restriction Policy readiness."); } }
export async function POST(request: Request) { try { await requireTrustContractRestrictionPolicyUser(); return apiSuccess(await readinessRequest(request)); } catch (error) { return apiError(error, "Unable to project Trust Contracts & Restriction Policy readiness."); } }
