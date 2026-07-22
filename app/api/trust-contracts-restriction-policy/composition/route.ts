import { apiError, apiSuccess } from "@/src/server/api/response";
import { compositionRequest, requireTrustContractRestrictionPolicyUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustContractRestrictionPolicyUser(); return apiSuccess(await compositionRequest()); } catch (error) { return apiError(error, "Unable to inspect restriction composition."); } }
export async function POST(request: Request) { try { await requireTrustContractRestrictionPolicyUser(); return apiSuccess(await compositionRequest(request)); } catch (error) { return apiError(error, "Unable to project restriction composition."); } }
