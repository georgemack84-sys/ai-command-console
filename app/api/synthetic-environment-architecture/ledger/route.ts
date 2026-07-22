import { apiError, apiSuccess } from "@/src/server/api/response";
import { ledgerRequest, requireSyntheticEnvironmentArchitectureUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireSyntheticEnvironmentArchitectureUser(); return apiSuccess(await ledgerRequest()); } catch (error) { return apiError(error, "Unable to load synthetic environment ledger."); } }
export async function POST(request: Request) { try { await requireSyntheticEnvironmentArchitectureUser(); return apiSuccess(await ledgerRequest(request)); } catch (error) { return apiError(error, "Unable to load synthetic environment ledger."); } }
