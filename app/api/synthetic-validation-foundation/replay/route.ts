import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayRequest, requireSyntheticValidationFoundationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireSyntheticValidationFoundationUser(); return apiSuccess(await replayRequest()); } catch (error) { return apiError(error, "Unable to load synthetic validation replay."); } }
export async function POST(request: Request) { try { await requireSyntheticValidationFoundationUser(); return apiSuccess(await replayRequest(request)); } catch (error) { return apiError(error, "Unable to load synthetic validation replay."); } }
