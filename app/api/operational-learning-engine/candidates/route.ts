import { candidatesRequest, requireOperationalLearningUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/responses";

export async function GET() { try { await requireOperationalLearningUser(); return apiSuccess(await candidatesRequest()); } catch (error) { return apiError(error, "Unable to read learning candidates."); } }
export async function POST(request: Request) { try { await requireOperationalLearningUser(); return apiSuccess(await candidatesRequest(request)); } catch (error) { return apiError(error, "Unable to read learning candidates."); } }
