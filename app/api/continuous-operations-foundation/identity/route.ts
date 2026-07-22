import { identityRequest, requireContinuousOperationsFoundationUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireContinuousOperationsFoundationUser(); return apiSuccess(await identityRequest()); } catch (error) { return apiError(error, "Unable to read operational identity."); } }
export async function POST(request: Request) { try { await requireContinuousOperationsFoundationUser(); return apiSuccess(await identityRequest(request)); } catch (error) { return apiError(error, "Unable to read operational identity."); } }
