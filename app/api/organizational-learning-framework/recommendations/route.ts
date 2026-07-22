import { apiError, apiSuccess } from "@/src/server/api/response";
import { recommendationsRequest, requireOrganizationalLearningUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireOrganizationalLearningUser(); return apiSuccess(await recommendationsRequest()); } catch (error) { return apiError(error, "Unable to retrieve organizational recommendations."); } }
export async function POST(request: Request) { try { await requireOrganizationalLearningUser(); return apiSuccess(await recommendationsRequest(request)); } catch (error) { return apiError(error, "Unable to retrieve organizational recommendations."); } }
