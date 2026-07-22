import { apiError, apiSuccess } from "@/src/server/api/response";
import { artifactReplayRequest, requireStrategicAssuranceUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireStrategicAssuranceUser(); return apiSuccess(await artifactReplayRequest()); } catch (error) { return apiError(error, "Unable to replay strategic artifact."); } }
export async function POST(request: Request) { try { await requireStrategicAssuranceUser(); return apiSuccess(await artifactReplayRequest(request)); } catch (error) { return apiError(error, "Unable to replay strategic artifact."); } }
