import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayRequest, requireApexUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireApexUser(); return apiSuccess(await replayRequest()); } catch (error) { return apiError(error, "Unable to inspect APEX replay integration."); } }
export async function POST(request: Request) { try { await requireApexUser(); return apiSuccess(await replayRequest(request)); } catch (error) { return apiError(error, "Unable to inspect APEX replay integration."); } }
