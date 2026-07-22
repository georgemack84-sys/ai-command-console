import { replayRequest, requireProductionCertificationUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireProductionCertificationUser(); return apiSuccess(await replayRequest()); } catch (error) { return apiError(error, "Unable to load production certification replay."); } }
export async function POST(request: Request) { try { await requireProductionCertificationUser(); return apiSuccess(await replayRequest(request)); } catch (error) { return apiError(error, "Unable to load production certification replay."); } }
