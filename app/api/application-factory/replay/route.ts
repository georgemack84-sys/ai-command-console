import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayRequest, requireApplicationFactoryUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET(request: Request) { try { await requireApplicationFactoryUser(); return apiSuccess(await replayRequest(request)); } catch (error) { return apiError(error, "Unable to inspect Application Factory replay and evidence."); } }
