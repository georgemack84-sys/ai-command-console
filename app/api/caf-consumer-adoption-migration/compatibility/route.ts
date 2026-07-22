import { apiError, apiSuccess } from "@/src/server/api/response";
import { compatibilityRequest, requireConsumerAdoptionMigrationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireConsumerAdoptionMigrationUser(); return apiSuccess(await compatibilityRequest()); } catch (error) { return apiError(error, "Unable to inspect CAF migration compatibility."); } }
export async function POST(request: Request) { try { await requireConsumerAdoptionMigrationUser(); return apiSuccess(await compatibilityRequest(request)); } catch (error) { return apiError(error, "Unable to inspect CAF migration compatibility."); } }
