import { apiError, apiSuccess } from "@/src/server/api/response";
import { observabilityRequest, requireTrustRiskGovernanceUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustRiskGovernanceUser(); return apiSuccess(await observabilityRequest()); } catch (error) { return apiError(error, "Unable to inspect risk observability."); } }
export async function POST(request: Request) { try { await requireTrustRiskGovernanceUser(); return apiSuccess(await observabilityRequest(request)); } catch (error) { return apiError(error, "Unable to project risk observability."); } }
