import { qualificationRequest, requireCrossRegionReplicationUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireCrossRegionReplicationUser(); return apiSuccess(await qualificationRequest()); } catch (error) { return apiError(error, "Unable to read replication qualification."); } }
export async function POST(request: Request) { try { await requireCrossRegionReplicationUser(); return apiSuccess(await qualificationRequest(request)); } catch (error) { return apiError(error, "Unable to read replication qualification."); } }
