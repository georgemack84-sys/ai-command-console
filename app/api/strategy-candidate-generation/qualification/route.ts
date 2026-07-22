import { apiError, apiSuccess } from "@/src/server/api/response";
import { qualificationRequest, requireStrategyCandidateUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireStrategyCandidateUser(); return apiSuccess(await qualificationRequest()); } catch (error) { return apiError(error, "Unable to qualify candidates."); } }
export async function POST(request: Request) { try { await requireStrategyCandidateUser(); return apiSuccess(await qualificationRequest(request)); } catch (error) { return apiError(error, "Unable to qualify candidates."); } }
