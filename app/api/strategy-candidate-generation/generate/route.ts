import { apiError, apiSuccess } from "@/src/server/api/response";
import { generateRequest, requireStrategyCandidateUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireStrategyCandidateUser(); return apiSuccess(await generateRequest()); } catch (error) { return apiError(error, "Unable to generate strategy candidates."); } }
export async function POST(request: Request) { try { await requireStrategyCandidateUser(); return apiSuccess(await generateRequest(request)); } catch (error) { return apiError(error, "Unable to generate strategy candidates."); } }
