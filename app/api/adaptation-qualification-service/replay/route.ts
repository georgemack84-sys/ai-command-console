import { replayRequest, requireAdaptationQualificationUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/responses";

export async function GET() { try { await requireAdaptationQualificationUser(); return apiSuccess(await replayRequest()); } catch (error) { return apiError(error, "Unable to read qualification replay."); } }
export async function POST(request: Request) { try { await requireAdaptationQualificationUser(); return apiSuccess(await replayRequest(request)); } catch (error) { return apiError(error, "Unable to read qualification replay."); } }
