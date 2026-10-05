import { apiError, apiSuccess } from "@/src/server/api/response";
import { getSessionUser } from "@/src/lib/auth";
import { listNuruDiscoverCatalog } from "@/src/server/services/nuru-discover-catalog-service";
import { getNuruDiscoverInterestState } from "@/src/server/services/nuru-discover-interest-service";
import { getNuruDiscoverTopicPreferences } from "@/src/server/services/nuru-discover-topic-preference-service";
import { getNuruTasteRankingContext } from "@/src/server/services/nuru-taste-interview-service";
import { buildNuruDiscoverSession, nuruDiscoverSessionInputSchema } from "@/src/server/services/nuru-discover-recommendation-service";

export const dynamic = "force-dynamic";

/** The public Discover surface receives only items already admitted by a governor. */
export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const user = await getSessionUser();
    const [interest, explicitTopics, tasteContext] = user
      ? await Promise.all([getNuruDiscoverInterestState(user.id), getNuruDiscoverTopicPreferences(user.id), getNuruTasteRankingContext(user.id)])
      : [{ savedItemIds: [], dismissedItemIds: [] }, [], { preferredTopics: [], excludedTopics: [], signals: [] }];
    const input = nuruDiscoverSessionInputSchema.parse({
      preferredTopics: [...params.getAll("topic"), ...explicitTopics, ...tasteContext.preferredTopics],
      excludedTopics: tasteContext.excludedTopics,
      tasteSignals: tasteContext.signals,
      dismissedItemIds: [...params.getAll("dismissed"), ...interest.dismissedItemIds],
      ...(params.has("limit") ? { limit: Number(params.get("limit")) } : {}),
    });
    return apiSuccess({ ...buildNuruDiscoverSession(await listNuruDiscoverCatalog(100), input), interest, explicitTopics, tasteContext });
  } catch (error) {
    return apiError(error, "Unable to prepare the Nuru Discover session.");
  }
}
