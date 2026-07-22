import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayRequest, requireStrategyCandidateUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireStrategyCandidateUser(); return apiSuccess(await replayRequest()); } catch (error) { return apiError(error, "Unable to replay candidate generation."); } }
export async function POST(request: Request) { try { await requireStrategyCandidateUser(); return apiSuccess(await replayRequest(request)); } catch (error) { return apiError(error, "Unable to replay candidate generation."); } }
