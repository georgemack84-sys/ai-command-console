import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireConsumerAdoptionMigrationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireConsumerAdoptionMigrationUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to inspect CAF consumer adoption migration contract."); } }
