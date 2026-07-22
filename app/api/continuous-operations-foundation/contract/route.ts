import { contractResponse, requireContinuousOperationsFoundationUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireContinuousOperationsFoundationUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to read Continuous Operations Foundation contract."); } }
