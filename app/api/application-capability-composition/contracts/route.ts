import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractsRequest, requireApplicationCapabilityCompositionUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireApplicationCapabilityCompositionUser(); return apiSuccess(await contractsRequest()); } catch (error) { return apiError(error, "Unable to inspect composition contracts."); } }
export async function POST(request: Request) { try { await requireApplicationCapabilityCompositionUser(); return apiSuccess(await contractsRequest(request)); } catch (error) { return apiError(error, "Unable to inspect composition contracts."); } }
