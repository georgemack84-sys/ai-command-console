import { apiError, apiSuccess } from "@/src/server/api/response";
import { ledgerRequest, requireStrategicGovernanceUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireStrategicGovernanceUser(); return apiSuccess(await ledgerRequest()); } catch (error) { return apiError(error, "Unable to inspect strategic governance ledger."); } }
export async function POST(request: Request) { try { await requireStrategicGovernanceUser(); return apiSuccess(await ledgerRequest(request)); } catch (error) { return apiError(error, "Unable to inspect strategic governance ledger."); } }
