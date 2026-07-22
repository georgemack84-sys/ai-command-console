import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayRequest, requireAdvisoryBoundaryValidationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireAdvisoryBoundaryValidationUser(); return apiSuccess(await replayRequest()); } catch (error) { return apiError(error, "Unable to load advisory boundary replay."); } }
export async function POST(request: Request) { try { await requireAdvisoryBoundaryValidationUser(); return apiSuccess(await replayRequest(request)); } catch (error) { return apiError(error, "Unable to load advisory boundary replay."); } }
