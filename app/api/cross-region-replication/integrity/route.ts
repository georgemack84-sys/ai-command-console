import { integrityRequest, requireCrossRegionReplicationUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireCrossRegionReplicationUser(); return apiSuccess(await integrityRequest()); } catch (error) { return apiError(error, "Unable to read replication integrity."); } }
export async function POST(request: Request) { try { await requireCrossRegionReplicationUser(); return apiSuccess(await integrityRequest(request)); } catch (error) { return apiError(error, "Unable to read replication integrity."); } }
