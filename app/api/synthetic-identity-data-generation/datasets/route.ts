import { apiError, apiSuccess } from "@/src/server/api/response";
import { datasetsRequest, requireSyntheticIdentityDataGenerationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireSyntheticIdentityDataGenerationUser(); return apiSuccess(await datasetsRequest()); } catch (error) { return apiError(error, "Unable to load synthetic datasets."); } }
export async function POST(request: Request) { try { await requireSyntheticIdentityDataGenerationUser(); return apiSuccess(await datasetsRequest(request)); } catch (error) { return apiError(error, "Unable to load synthetic datasets."); } }
