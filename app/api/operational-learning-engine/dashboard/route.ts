import { dashboardRequest, requireOperationalLearningUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/responses";

export async function GET() { try { await requireOperationalLearningUser(); return apiSuccess(await dashboardRequest()); } catch (error) { return apiError(error, "Unable to read learning dashboard."); } }
export async function POST(request: Request) { try { await requireOperationalLearningUser(); return apiSuccess(await dashboardRequest(request)); } catch (error) { return apiError(error, "Unable to read learning dashboard."); } }
