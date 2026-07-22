import { replayRequest, requireContinuousOperationalCertificationUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/responses";

export async function GET() { try { await requireContinuousOperationalCertificationUser(); return apiSuccess(await replayRequest()); } catch (error) { return apiError(error, "Unable to read certification replay."); } }
export async function POST(request: Request) { try { await requireContinuousOperationalCertificationUser(); return apiSuccess(await replayRequest(request)); } catch (error) { return apiError(error, "Unable to read certification replay."); } }
