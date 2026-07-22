import { patternsRequest, requireOperationalLearningUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/responses";

export async function GET() { try { await requireOperationalLearningUser(); return apiSuccess(await patternsRequest()); } catch (error) { return apiError(error, "Unable to read operational patterns."); } }
export async function POST(request: Request) { try { await requireOperationalLearningUser(); return apiSuccess(await patternsRequest(request)); } catch (error) { return apiError(error, "Unable to read operational patterns."); } }
