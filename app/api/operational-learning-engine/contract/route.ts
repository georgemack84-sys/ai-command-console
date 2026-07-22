import { contractResponse, requireOperationalLearningUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/responses";

export async function GET() { try { await requireOperationalLearningUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to read Operational Learning Engine contract."); } }
