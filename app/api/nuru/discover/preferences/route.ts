import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { listNuruDiscoverCatalog } from "@/src/server/services/nuru-discover-catalog-service";
import { getNuruDiscoverTopicPreferences, nuruDiscoverTopicPreferencesSchema, setNuruDiscoverTopicPreferences } from "@/src/server/services/nuru-discover-topic-preference-service";

export const dynamic = "force-dynamic";

async function requireDiscoverUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Sign in to edit your Discover interests.");
  return user;
}

export async function GET() {
  try {
    const user = await requireDiscoverUser();
    const [topics, catalog] = await Promise.all([getNuruDiscoverTopicPreferences(user.id), listNuruDiscoverCatalog(100)]);
    const availableTopics = [...new Set(catalog.flatMap((item) => item.topics))].sort((left, right) => left.localeCompare(right));
    return apiSuccess({ topics, availableTopics });
  } catch (error) {
    return apiError(error, "Unable to load Discover interests.");
  }
}

export async function PUT(request: Request) {
  try {
    const user = await requireDiscoverUser();
    return apiSuccess({ topics: await setNuruDiscoverTopicPreferences(user.id, nuruDiscoverTopicPreferencesSchema.parse(await request.json())) });
  } catch (error) {
    return apiError(error, "Unable to update Discover interests.");
  }
}
