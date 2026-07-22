import { apiError, apiSuccess } from "@/src/server/api/response";
import { governanceRequest, requirePbgUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requirePbgUser(); return apiSuccess(await governanceRequest()); } catch (error) { return apiError(error, "Unable to inspect PBG organizational governance."); } }
export async function POST(request: Request) { try { await requirePbgUser(); return apiSuccess(await governanceRequest(request)); } catch (error) { return apiError(error, "Unable to inspect PBG organizational governance."); } }
