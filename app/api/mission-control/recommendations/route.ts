import { apiError, apiSuccess } from "@/src/server/api/response";
import { recommendationsRequest, requireMissionControlUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireMissionControlUser(); return apiSuccess(await recommendationsRequest()); } catch (error) { return apiError(error, "Unable to inspect recommendation center."); } }
export async function POST(request: Request) { try { await requireMissionControlUser(); return apiSuccess(await recommendationsRequest(request)); } catch (error) { return apiError(error, "Unable to inspect recommendation center."); } }
