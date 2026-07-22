import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireProductionReplayUser, twinRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireProductionReplayUser(); return apiSuccess(await twinRequest()); } catch (error) { return apiError(error, "Unable to load production digital twin."); } }
export async function POST(request: Request) { try { await requireProductionReplayUser(); return apiSuccess(await twinRequest(request)); } catch (error) { return apiError(error, "Unable to load production digital twin."); } }
