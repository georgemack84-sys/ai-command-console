import type { SourceType } from "@prisma/client";
import { AppError } from "@/src/server/api/errors";
import type { IngestionRefreshInput, SourceConnector } from "@/src/server/ingestion/connectors/types";

export function registerStubConnector(type: SourceType, register: (connector: SourceConnector) => void) {
  const connector: SourceConnector = {
    type,
    supportsRefresh: false,
    refresh: async (input: IngestionRefreshInput) => {
      throw new AppError(400, "connector_not_supported", `Connector ${input.sourceType} is not available yet.`);
    },
  };
  register(connector);
}
