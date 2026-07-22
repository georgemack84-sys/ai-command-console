import { apiError, apiSuccess } from "@/src/server/api/response";
import { registriesRequest, requireTrustContractRestrictionPolicyUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustContractRestrictionPolicyUser(); return apiSuccess(await registriesRequest()); } catch (error) { return apiError(error, "Unable to inspect contract and policy registries."); } }
export async function POST(request: Request) { try { await requireTrustContractRestrictionPolicyUser(); return apiSuccess(await registriesRequest(request)); } catch (error) { return apiError(error, "Unable to project contract and policy registries."); } }
