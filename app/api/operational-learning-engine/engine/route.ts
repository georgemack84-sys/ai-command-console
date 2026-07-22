import { engineRequest, requireOperationalLearningUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/responses";

export async function GET() { try { await requireOperationalLearningUser(); return apiSuccess(await engineRequest()); } catch (error) { return apiError(error, "Unable to read operational learning engine."); } }
export async function POST(request: Request) { try { await requireOperationalLearningUser(); return apiSuccess(await engineRequest(request)); } catch (error) { return apiError(error, "Unable to read operational learning engine."); } }
