import { apiError, apiSuccess } from "@/src/server/api/response";
import { observabilityRequest, requireOrganizationalLearningUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireOrganizationalLearningUser(); return apiSuccess(await observabilityRequest()); } catch (error) { return apiError(error, "Unable to retrieve organizational learning observability."); } }
export async function POST(request: Request) { try { await requireOrganizationalLearningUser(); return apiSuccess(await observabilityRequest(request)); } catch (error) { return apiError(error, "Unable to inspect organizational learning observability."); } }
