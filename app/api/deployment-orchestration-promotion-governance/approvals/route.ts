import { apiError, apiSuccess } from "@/src/server/api/response";
import { approvalsRequest, requireDeploymentGovernanceUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireDeploymentGovernanceUser(); return apiSuccess(await approvalsRequest()); } catch (error) { return apiError(error, "Unable to load deployment approvals."); } }
export async function POST(request: Request) { try { await requireDeploymentGovernanceUser(); return apiSuccess(await approvalsRequest(request)); } catch (error) { return apiError(error, "Unable to load deployment approvals."); } }
