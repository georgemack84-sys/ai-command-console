import { apiError, apiSuccess } from "@/src/server/api/response";
import { lessonsRequest, requireOrganizationalLearningUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireOrganizationalLearningUser(); return apiSuccess(await lessonsRequest()); } catch (error) { return apiError(error, "Unable to retrieve organizational lessons."); } }
export async function POST(request: Request) { try { await requireOrganizationalLearningUser(); return apiSuccess(await lessonsRequest(request)); } catch (error) { return apiError(error, "Unable to retrieve organizational lessons."); } }
