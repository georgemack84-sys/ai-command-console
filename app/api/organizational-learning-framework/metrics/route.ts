import { apiError, apiSuccess } from "@/src/server/api/response";
import { metricsRequest, requireOrganizationalLearningUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireOrganizationalLearningUser(); return apiSuccess(await metricsRequest()); } catch (error) { return apiError(error, "Unable to retrieve organizational learning metrics."); } }
export async function POST(request: Request) { try { await requireOrganizationalLearningUser(); return apiSuccess(await metricsRequest(request)); } catch (error) { return apiError(error, "Unable to retrieve organizational learning metrics."); } }
