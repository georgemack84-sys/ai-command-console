import { apiError, apiSuccess } from "@/src/server/api/response";
import { matrixRequest, requireTrustContractRestrictionPolicyUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustContractRestrictionPolicyUser(); return apiSuccess(await matrixRequest()); } catch (error) { return apiError(error, "Unable to inspect standing restriction matrix."); } }
export async function POST(request: Request) { try { await requireTrustContractRestrictionPolicyUser(); return apiSuccess(await matrixRequest(request)); } catch (error) { return apiError(error, "Unable to project standing restriction matrix."); } }
