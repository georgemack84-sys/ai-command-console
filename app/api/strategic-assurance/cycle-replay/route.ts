import { apiError, apiSuccess } from "@/src/server/api/response";
import { cycleReplayRequest, requireStrategicAssuranceUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireStrategicAssuranceUser(); return apiSuccess(await cycleReplayRequest()); } catch (error) { return apiError(error, "Unable to replay strategic cycle."); } }
export async function POST(request: Request) { try { await requireStrategicAssuranceUser(); return apiSuccess(await cycleReplayRequest(request)); } catch (error) { return apiError(error, "Unable to replay strategic cycle."); } }
