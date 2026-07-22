import { apiError, apiSuccess } from "@/src/server/api/response";
import { reportsRequest, requireConsumerAdoptionMigrationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireConsumerAdoptionMigrationUser(); return apiSuccess(await reportsRequest()); } catch (error) { return apiError(error, "Unable to inspect CAF adoption reports."); } }
export async function POST(request: Request) { try { await requireConsumerAdoptionMigrationUser(); return apiSuccess(await reportsRequest(request)); } catch (error) { return apiError(error, "Unable to inspect CAF adoption reports."); } }
