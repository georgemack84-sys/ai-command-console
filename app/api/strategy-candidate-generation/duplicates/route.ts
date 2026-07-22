import { apiError, apiSuccess } from "@/src/server/api/response";
import { duplicatesRequest, requireStrategyCandidateUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireStrategyCandidateUser(); return apiSuccess(await duplicatesRequest()); } catch (error) { return apiError(error, "Unable to detect duplicate candidates."); } }
export async function POST(request: Request) { try { await requireStrategyCandidateUser(); return apiSuccess(await duplicatesRequest(request)); } catch (error) { return apiError(error, "Unable to detect duplicate candidates."); } }
