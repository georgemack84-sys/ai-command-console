import { certificationRequest, requireContinuousOperationsFoundationUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireContinuousOperationsFoundationUser(); return apiSuccess(await certificationRequest()); } catch (error) { return apiError(error, "Unable to read continuous operations certification."); } }
export async function POST(request: Request) { try { await requireContinuousOperationsFoundationUser(); return apiSuccess(await certificationRequest(request)); } catch (error) { return apiError(error, "Unable to read continuous operations certification."); } }
