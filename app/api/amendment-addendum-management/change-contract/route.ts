import { apiError, apiSuccess } from "@/src/server/api/response";
import { changeContractRequest, requireAmendmentAddendumUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireAmendmentAddendumUser(); return apiSuccess(await changeContractRequest()); } catch (error) { return apiError(error, "Unable to retrieve specification change contract."); } }
export async function POST(request: Request) { try { await requireAmendmentAddendumUser(); return apiSuccess(await changeContractRequest(request)); } catch (error) { return apiError(error, "Unable to retrieve specification change contract."); } }
