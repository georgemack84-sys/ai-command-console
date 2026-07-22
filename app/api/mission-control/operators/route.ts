import { apiError, apiSuccess } from "@/src/server/api/response";
import { operatorsRequest, requireMissionControlUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireMissionControlUser(); return apiSuccess(await operatorsRequest()); } catch (error) { return apiError(error, "Unable to inspect operator workspace."); } }
export async function POST(request: Request) { try { await requireMissionControlUser(); return apiSuccess(await operatorsRequest(request)); } catch (error) { return apiError(error, "Unable to inspect operator workspace."); } }
