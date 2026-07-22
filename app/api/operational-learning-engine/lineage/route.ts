import { lineageRequest, requireOperationalLearningUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/responses";

export async function GET() { try { await requireOperationalLearningUser(); return apiSuccess(await lineageRequest()); } catch (error) { return apiError(error, "Unable to read learning lineage."); } }
export async function POST(request: Request) { try { await requireOperationalLearningUser(); return apiSuccess(await lineageRequest(request)); } catch (error) { return apiError(error, "Unable to read learning lineage."); } }
