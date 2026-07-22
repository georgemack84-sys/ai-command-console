import { apiError, apiSuccess } from "@/src/server/api/response";
import { operatorRequest, requireStrategicGovernanceUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireStrategicGovernanceUser(); return apiSuccess(await operatorRequest()); } catch (error) { return apiError(error, "Unable to validate operator supremacy."); } }
export async function POST(request: Request) { try { await requireStrategicGovernanceUser(); return apiSuccess(await operatorRequest(request)); } catch (error) { return apiError(error, "Unable to validate operator supremacy."); } }
