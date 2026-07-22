import { apiError, apiSuccess } from "@/src/server/api/response";
import { readinessRequest, requireTrustRiskGovernanceUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustRiskGovernanceUser(); return apiSuccess(await readinessRequest()); } catch (error) { return apiError(error, "Unable to inspect Risk Modeling & Governance readiness."); } }
export async function POST(request: Request) { try { await requireTrustRiskGovernanceUser(); return apiSuccess(await readinessRequest(request)); } catch (error) { return apiError(error, "Unable to project Risk Modeling & Governance readiness."); } }
