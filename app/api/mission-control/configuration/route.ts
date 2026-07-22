import { apiError, apiSuccess } from "@/src/server/api/response";
import { configurationRequest, requireMissionControlUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireMissionControlUser(); return apiSuccess(await configurationRequest()); } catch (error) { return apiError(error, "Unable to inspect Mission Control configuration."); } }
export async function POST(request: Request) { try { await requireMissionControlUser(); return apiSuccess(await configurationRequest(request)); } catch (error) { return apiError(error, "Unable to inspect Mission Control configuration."); } }
