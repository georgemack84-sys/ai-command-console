import type { IngestionRefreshInput, SourceConnector } from "@/src/server/ingestion/connectors/types";
import { refreshRssSource } from "@/src/server/services/rss-ingestion-service";

export function registerRssConnector(register: (connector: SourceConnector) => void) {
  const connector: SourceConnector = {
    type: "feed",
    supportsRefresh: true,
    refresh: async (input: IngestionRefreshInput) =>
      refreshRssSource({
        sourceId: input.sourceId,
        workspaceId: input.workspaceId,
        requestedById: input.requestedById,
        traceId: input.traceId,
      }),
  };

  register(connector);
}
