import { authorityRequest, requireContinuousOperationsFoundationUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireContinuousOperationsFoundationUser(); return apiSuccess(await authorityRequest()); } catch (error) { return apiError(error, "Unable to read operational authority."); } }
export async function POST(request: Request) { try { await requireContinuousOperationsFoundationUser(); return apiSuccess(await authorityRequest(request)); } catch (error) { return apiError(error, "Unable to read operational authority."); } }
