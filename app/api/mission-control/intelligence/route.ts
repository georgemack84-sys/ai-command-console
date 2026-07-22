import { apiError, apiSuccess } from "@/src/server/api/response";
import { intelligenceRequest, requireMissionControlUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireMissionControlUser(); return apiSuccess(await intelligenceRequest()); } catch (error) { return apiError(error, "Unable to inspect strategic intelligence."); } }
export async function POST(request: Request) { try { await requireMissionControlUser(); return apiSuccess(await intelligenceRequest(request)); } catch (error) { return apiError(error, "Unable to inspect strategic intelligence."); } }
