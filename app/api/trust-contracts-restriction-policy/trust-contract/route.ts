import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireTrustContractRestrictionPolicyUser, trustContractRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustContractRestrictionPolicyUser(); return apiSuccess(await trustContractRequest()); } catch (error) { return apiError(error, "Unable to inspect trust contract."); } }
export async function POST(request: Request) { try { await requireTrustContractRestrictionPolicyUser(); return apiSuccess(await trustContractRequest(request)); } catch (error) { return apiError(error, "Unable to project trust contract."); } }
