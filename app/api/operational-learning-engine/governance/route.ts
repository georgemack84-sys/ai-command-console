import { governanceRequest, requireOperationalLearningUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/responses";

export async function GET() { try { await requireOperationalLearningUser(); return apiSuccess(await governanceRequest()); } catch (error) { return apiError(error, "Unable to read learning governance."); } }
export async function POST(request: Request) { try { await requireOperationalLearningUser(); return apiSuccess(await governanceRequest(request)); } catch (error) { return apiError(error, "Unable to read learning governance."); } }
