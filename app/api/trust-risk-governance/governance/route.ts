import { apiError, apiSuccess } from "@/src/server/api/response";
import { governanceRequest, requireTrustRiskGovernanceUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustRiskGovernanceUser(); return apiSuccess(await governanceRequest()); } catch (error) { return apiError(error, "Unable to inspect risk governance and report."); } }
export async function POST(request: Request) { try { await requireTrustRiskGovernanceUser(); return apiSuccess(await governanceRequest(request)); } catch (error) { return apiError(error, "Unable to project risk governance and report."); } }
