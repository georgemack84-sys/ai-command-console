import { apiError, apiSuccess } from "@/src/server/api/response";
import { failClosedRequest, requireStrategicGovernanceUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireStrategicGovernanceUser(); return apiSuccess(await failClosedRequest()); } catch (error) { return apiError(error, "Unable to inspect strategic fail-closed enforcement."); } }
export async function POST(request: Request) { try { await requireStrategicGovernanceUser(); return apiSuccess(await failClosedRequest(request)); } catch (error) { return apiError(error, "Unable to inspect strategic fail-closed enforcement."); } }
