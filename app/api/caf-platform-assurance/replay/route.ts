import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayRequest, requirePlatformAssuranceUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requirePlatformAssuranceUser(); return apiSuccess(await replayRequest()); } catch (error) { return apiError(error, "Unable to inspect CAF replay assurance."); } }
export async function POST(request: Request) { try { await requirePlatformAssuranceUser(); return apiSuccess(await replayRequest(request)); } catch (error) { return apiError(error, "Unable to inspect CAF replay assurance."); } }
