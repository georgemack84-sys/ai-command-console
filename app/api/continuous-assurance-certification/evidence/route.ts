import { evidenceRequest, requireContinuousAssuranceUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireContinuousAssuranceUser(); return apiSuccess(await evidenceRequest()); } catch (error) { return apiError(error, "Unable to load certification evidence freshness."); } }
export async function POST(request: Request) { try { await requireContinuousAssuranceUser(); return apiSuccess(await evidenceRequest(request)); } catch (error) { return apiError(error, "Unable to load certification evidence freshness."); } }
