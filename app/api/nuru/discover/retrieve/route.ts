import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { nuruRetrievalInputSchema, retrieveNuruDiscoveryCandidatesWithStatus } from "@/src/server/services/nuru-discovery-source-service";
export const dynamic = "force-dynamic";
export async function POST(request: Request) { try { if (!(await getSessionUser())) throw new AppError(401, "unauthorized", "Sign in to ask Nuru to search trusted sources."); return apiSuccess(await retrieveNuruDiscoveryCandidatesWithStatus(nuruRetrievalInputSchema.parse(await request.json())), { status: 201 }); } catch (error) { return apiError(error, "Nuru could not retrieve discovery candidates."); } }
