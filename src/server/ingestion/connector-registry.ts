import { AppError } from "@/src/server/api/errors";
import type { SourceType } from "@prisma/client";
import type { IngestionResult, IngestionRefreshInput, SourceConnector } from "@/src/server/ingestion/connectors/types";
import { registerRssConnector } from "@/src/server/ingestion/connectors/rss-connector";
import { registerStubConnector } from "@/src/server/ingestion/connectors/stub-connector";

const connectorRegistry = new Map<SourceType, SourceConnector>();

export function registerConnector(connector: SourceConnector) {
  connectorRegistry.set(connector.type, connector);
}

export function ensureConnectorRegistry() {
  if (connectorRegistry.size > 0) {
    return;
  }
  registerRssConnector(registerConnector);
  registerStubConnector("website", registerConnector);
  registerStubConnector("repository", registerConnector);
  registerStubConnector("integration", registerConnector);
  registerStubConnector("document", registerConnector);
}

export function getConnector(type: SourceType) {
  ensureConnectorRegistry();
  return connectorRegistry.get(type) ?? null;
}

export function assertConnectorSupportsRefresh(type: SourceType) {
  const connector = getConnector(type);
  if (!connector || !connector.supportsRefresh) {
    throw new AppError(400, "connector_not_supported", "This source type does not support refresh yet.");
  }
  return connector;
}

export async function refreshSourceByConnector(input: IngestionRefreshInput): Promise<IngestionResult> {
  const connector = assertConnectorSupportsRefresh(input.sourceType);
  return connector.refresh(input);
}
