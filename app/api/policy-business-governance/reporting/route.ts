import { apiError, apiSuccess } from "@/src/server/api/response";
import { reportingRequest, requirePbgUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requirePbgUser(); return apiSuccess(await reportingRequest()); } catch (error) { return apiError(error, "Unable to inspect PBG reporting."); } }
export async function POST(request: Request) { try { await requirePbgUser(); return apiSuccess(await reportingRequest(request)); } catch (error) { return apiError(error, "Unable to inspect PBG reporting."); } }
