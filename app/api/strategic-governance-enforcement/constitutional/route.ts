import { apiError, apiSuccess } from "@/src/server/api/response";
import { constitutionalRequest, requireStrategicGovernanceUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireStrategicGovernanceUser(); return apiSuccess(await constitutionalRequest()); } catch (error) { return apiError(error, "Unable to validate strategic constitution."); } }
export async function POST(request: Request) { try { await requireStrategicGovernanceUser(); return apiSuccess(await constitutionalRequest(request)); } catch (error) { return apiError(error, "Unable to validate strategic constitution."); } }
