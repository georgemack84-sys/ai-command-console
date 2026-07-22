import { apiError, apiSuccess } from "@/src/server/api/response";
import { ledgerRequest, requireStrategicAssuranceUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireStrategicAssuranceUser(); return apiSuccess(await ledgerRequest()); } catch (error) { return apiError(error, "Unable to inspect strategic assurance ledger."); } }
export async function POST(request: Request) { try { await requireStrategicAssuranceUser(); return apiSuccess(await ledgerRequest(request)); } catch (error) { return apiError(error, "Unable to inspect strategic assurance ledger."); } }
