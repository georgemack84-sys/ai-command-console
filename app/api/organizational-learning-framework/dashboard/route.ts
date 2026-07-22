import { apiError, apiSuccess } from "@/src/server/api/response";
import { dashboardRequest, requireOrganizationalLearningUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireOrganizationalLearningUser(); return apiSuccess(await dashboardRequest()); } catch (error) { return apiError(error, "Unable to inspect organizational learning framework."); } }
export async function POST(request: Request) { try { await requireOrganizationalLearningUser(); return apiSuccess(await dashboardRequest(request)); } catch (error) { return apiError(error, "Unable to run organizational learning framework."); } }
