import { apiError, apiSuccess } from "@/src/server/api/response";
import { modelRequest, requireTrustRiskGovernanceUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustRiskGovernanceUser(); return apiSuccess(await modelRequest()); } catch (error) { return apiError(error, "Unable to inspect risk model."); } }
export async function POST(request: Request) { try { await requireTrustRiskGovernanceUser(); return apiSuccess(await modelRequest(request)); } catch (error) { return apiError(error, "Unable to project risk model."); } }
