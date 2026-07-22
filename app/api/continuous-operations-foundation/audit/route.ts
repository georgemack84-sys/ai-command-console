import { auditRequest, requireContinuousOperationsFoundationUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireContinuousOperationsFoundationUser(); return apiSuccess(await auditRequest()); } catch (error) { return apiError(error, "Unable to read operational audit contract."); } }
export async function POST(request: Request) { try { await requireContinuousOperationsFoundationUser(); return apiSuccess(await auditRequest(request)); } catch (error) { return apiError(error, "Unable to read operational audit contract."); } }
