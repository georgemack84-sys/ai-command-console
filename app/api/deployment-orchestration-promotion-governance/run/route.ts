import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireDeploymentGovernanceUser, resultRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireDeploymentGovernanceUser(); return apiSuccess(await resultRequest()); } catch (error) { return apiError(error, "Unable to run deployment governance."); } }
export async function POST(request: Request) { try { await requireDeploymentGovernanceUser(); return apiSuccess(await resultRequest(request)); } catch (error) { return apiError(error, "Unable to run deployment governance."); } }
