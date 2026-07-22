import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireProposedResponseDashboardUser, sectionRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function POST(request: Request) { try { await requireProposedResponseDashboardUser(); return apiSuccess(await sectionRequest(request, "replay_view")); } catch (error) { return apiError(error, "Unable to retrieve replay navigation view."); } }
