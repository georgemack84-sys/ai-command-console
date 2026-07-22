import { contractResponse, requireContinuousOperationalCertificationUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/responses";

export async function GET() { try { await requireContinuousOperationalCertificationUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to read Continuous Operational Certification Service contract."); } }
