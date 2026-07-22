import { apiError, apiSuccess } from "@/src/server/api/response";
import { exceptionsRequest, requireTrustContractRestrictionPolicyUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustContractRestrictionPolicyUser(); return apiSuccess(await exceptionsRequest()); } catch (error) { return apiError(error, "Unable to inspect restriction exception governance."); } }
export async function POST(request: Request) { try { await requireTrustContractRestrictionPolicyUser(); return apiSuccess(await exceptionsRequest(request)); } catch (error) { return apiError(error, "Unable to project restriction exception governance."); } }
