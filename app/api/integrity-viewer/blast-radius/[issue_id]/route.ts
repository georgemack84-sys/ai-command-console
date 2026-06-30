import { apiError, apiSuccess } from "@/src/server/api/response";
import { getIntegrityDetailForRequest, requireIntegrityViewerUser } from "../../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ issue_id: string }> }) {
  try {
    await requireIntegrityViewerUser();
    const { issue_id } = await params;
    return apiSuccess(getIntegrityDetailForRequest(request, issue_id.replace(/^issue_/, "")).blast_radius);
  } catch (error) {
    return apiError(error, "Unable to load integrity blast radius.");
  }
}
