import { apiError, apiSuccess } from "@/src/server/api/response";
import { certificationRequest, requireSyntheticIdentityDataGenerationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireSyntheticIdentityDataGenerationUser(); return apiSuccess(await certificationRequest()); } catch (error) { return apiError(error, "Unable to load synthetic generation certification."); } }
export async function POST(request: Request) { try { await requireSyntheticIdentityDataGenerationUser(); return apiSuccess(await certificationRequest(request)); } catch (error) { return apiError(error, "Unable to load synthetic generation certification."); } }
