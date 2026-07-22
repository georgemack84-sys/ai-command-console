import { apiError, apiSuccess } from "@/src/server/api/response";
import { collaborationRequest, requireApexUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireApexUser(); return apiSuccess(await collaborationRequest()); } catch (error) { return apiError(error, "Unable to inspect APEX collaboration."); } }
export async function POST(request: Request) { try { await requireApexUser(); return apiSuccess(await collaborationRequest(request)); } catch (error) { return apiError(error, "Unable to inspect APEX collaboration."); } }
