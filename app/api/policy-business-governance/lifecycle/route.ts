import { apiError, apiSuccess } from "@/src/server/api/response";
import { lifecycleRequest, requirePbgUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requirePbgUser(); return apiSuccess(await lifecycleRequest()); } catch (error) { return apiError(error, "Unable to inspect PBG policy lifecycle."); } }
export async function POST(request: Request) { try { await requirePbgUser(); return apiSuccess(await lifecycleRequest(request)); } catch (error) { return apiError(error, "Unable to inspect PBG policy lifecycle."); } }
