import { ledgerRequest, requireContinuousCertificationDuringPilotUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireContinuousCertificationDuringPilotUser(); return apiSuccess(await ledgerRequest()); } catch (error) { return apiError(error, "Unable to load Continuous Certification ledger."); } }
export async function POST(request: Request) { try { await requireContinuousCertificationDuringPilotUser(); return apiSuccess(await ledgerRequest(request)); } catch (error) { return apiError(error, "Unable to load Continuous Certification ledger."); } }
