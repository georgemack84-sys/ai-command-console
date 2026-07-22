import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireMissionControlUser, workspaceRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireMissionControlUser(); return apiSuccess(await workspaceRequest()); } catch (error) { return apiError(error, "Unable to inspect Mission Control workspace."); } }
export async function POST(request: Request) { try { await requireMissionControlUser(); return apiSuccess(await workspaceRequest(request)); } catch (error) { return apiError(error, "Unable to inspect Mission Control workspace."); } }
