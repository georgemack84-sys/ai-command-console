import { requireContinuousOperationsFoundationUser, stateRequest } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireContinuousOperationsFoundationUser(); return apiSuccess(await stateRequest()); } catch (error) { return apiError(error, "Unable to read operational state."); } }
export async function POST(request: Request) { try { await requireContinuousOperationsFoundationUser(); return apiSuccess(await stateRequest(request)); } catch (error) { return apiError(error, "Unable to read operational state."); } }
