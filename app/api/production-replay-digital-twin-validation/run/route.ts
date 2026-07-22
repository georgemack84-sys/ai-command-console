import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireProductionReplayUser, resultRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireProductionReplayUser(); return apiSuccess(await resultRequest()); } catch (error) { return apiError(error, "Unable to run production replay digital twin validation."); } }
export async function POST(request: Request) { try { await requireProductionReplayUser(); return apiSuccess(await resultRequest(request)); } catch (error) { return apiError(error, "Unable to run production replay digital twin validation."); } }
