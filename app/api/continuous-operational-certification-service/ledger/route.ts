import { ledgerRequest, requireContinuousOperationalCertificationUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/responses";

export async function GET() { try { await requireContinuousOperationalCertificationUser(); return apiSuccess(await ledgerRequest()); } catch (error) { return apiError(error, "Unable to read certification ledger."); } }
export async function POST(request: Request) { try { await requireContinuousOperationalCertificationUser(); return apiSuccess(await ledgerRequest(request)); } catch (error) { return apiError(error, "Unable to read certification ledger."); } }
