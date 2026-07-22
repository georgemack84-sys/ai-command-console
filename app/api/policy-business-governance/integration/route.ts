import { apiError, apiSuccess } from "@/src/server/api/response";
import { integrationRequest, requirePbgUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requirePbgUser(); return apiSuccess(await integrationRequest()); } catch (error) { return apiError(error, "Unable to inspect PBG integration."); } }
export async function POST(request: Request) { try { await requirePbgUser(); return apiSuccess(await integrationRequest(request)); } catch (error) { return apiError(error, "Unable to inspect PBG integration."); } }
