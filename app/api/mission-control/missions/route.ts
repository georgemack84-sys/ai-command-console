import { apiError, apiSuccess } from "@/src/server/api/response";
import { missionsRequest, requireMissionControlUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireMissionControlUser(); return apiSuccess(await missionsRequest()); } catch (error) { return apiError(error, "Unable to inspect mission management."); } }
export async function POST(request: Request) { try { await requireMissionControlUser(); return apiSuccess(await missionsRequest(request)); } catch (error) { return apiError(error, "Unable to inspect mission management."); } }
