import { changesRequest, requireContinuousOperationalCertificationUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/responses";

export async function GET() { try { await requireContinuousOperationalCertificationUser(); return apiSuccess(await changesRequest()); } catch (error) { return apiError(error, "Unable to read operational changes."); } }
export async function POST(request: Request) { try { await requireContinuousOperationalCertificationUser(); return apiSuccess(await changesRequest(request)); } catch (error) { return apiError(error, "Unable to read operational changes."); } }
