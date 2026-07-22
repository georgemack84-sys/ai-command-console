import { apiError, apiSuccess } from "@/src/server/api/response";
import { governanceRequest, requireStrategicGovernanceUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireStrategicGovernanceUser(); return apiSuccess(await governanceRequest()); } catch (error) { return apiError(error, "Unable to validate strategic governance."); } }
export async function POST(request: Request) { try { await requireStrategicGovernanceUser(); return apiSuccess(await governanceRequest(request)); } catch (error) { return apiError(error, "Unable to validate strategic governance."); } }
