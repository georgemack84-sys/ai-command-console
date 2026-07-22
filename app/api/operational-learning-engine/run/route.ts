import { requireOperationalLearningUser, resultRequest } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/responses";

export async function GET() { try { await requireOperationalLearningUser(); return apiSuccess(await resultRequest()); } catch (error) { return apiError(error, "Unable to run Operational Learning Engine."); } }
export async function POST(request: Request) { try { await requireOperationalLearningUser(); return apiSuccess(await resultRequest(request)); } catch (error) { return apiError(error, "Unable to run Operational Learning Engine."); } }
