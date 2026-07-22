import { apiError, apiSuccess } from "@/src/server/api/response";
import { ledgerRequest, requirePlatformCertificationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requirePlatformCertificationUser(); return apiSuccess(await ledgerRequest()); } catch (error) { return apiError(error, "Unable to inspect CAF certification ledger."); } }
export async function POST(request: Request) { try { await requirePlatformCertificationUser(); return apiSuccess(await ledgerRequest(request)); } catch (error) { return apiError(error, "Unable to inspect CAF certification ledger."); } }
