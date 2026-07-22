import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireMissionControlUser, visualizationRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireMissionControlUser(); return apiSuccess(await visualizationRequest()); } catch (error) { return apiError(error, "Unable to inspect mission visualization."); } }
export async function POST(request: Request) { try { await requireMissionControlUser(); return apiSuccess(await visualizationRequest(request)); } catch (error) { return apiError(error, "Unable to inspect mission visualization."); } }
