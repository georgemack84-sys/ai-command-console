import { apiError, apiSuccess } from "@/src/server/api/response";
import { assessmentRequest, requireTrustRiskGovernanceUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustRiskGovernanceUser(); return apiSuccess(await assessmentRequest()); } catch (error) { return apiError(error, "Unable to inspect risk assessment."); } }
export async function POST(request: Request) { try { await requireTrustRiskGovernanceUser(); return apiSuccess(await assessmentRequest(request)); } catch (error) { return apiError(error, "Unable to project risk assessment."); } }
