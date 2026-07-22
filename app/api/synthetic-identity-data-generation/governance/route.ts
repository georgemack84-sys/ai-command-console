import { apiError, apiSuccess } from "@/src/server/api/response";
import { governanceRequest, requireSyntheticIdentityDataGenerationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireSyntheticIdentityDataGenerationUser(); return apiSuccess(await governanceRequest()); } catch (error) { return apiError(error, "Unable to load synthetic generation governance."); } }
export async function POST(request: Request) { try { await requireSyntheticIdentityDataGenerationUser(); return apiSuccess(await governanceRequest(request)); } catch (error) { return apiError(error, "Unable to load synthetic generation governance."); } }
