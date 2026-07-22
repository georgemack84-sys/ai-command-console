import { memoryRequest, requireOperationalLearningUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/responses";

export async function GET() { try { await requireOperationalLearningUser(); return apiSuccess(await memoryRequest()); } catch (error) { return apiError(error, "Unable to read operational memory."); } }
export async function POST(request: Request) { try { await requireOperationalLearningUser(); return apiSuccess(await memoryRequest(request)); } catch (error) { return apiError(error, "Unable to read operational memory."); } }
