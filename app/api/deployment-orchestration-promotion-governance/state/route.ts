import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireDeploymentGovernanceUser, stateRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireDeploymentGovernanceUser(); return apiSuccess(await stateRequest()); } catch (error) { return apiError(error, "Unable to load deployment state."); } }
export async function POST(request: Request) { try { await requireDeploymentGovernanceUser(); return apiSuccess(await stateRequest(request)); } catch (error) { return apiError(error, "Unable to load deployment state."); } }
