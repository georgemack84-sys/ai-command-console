import type { SourceType } from "@prisma/client";

export type IngestionRefreshInput = {
  sourceId: string;
  workspaceId: string;
  sourceType: SourceType;
  requestedById?: string | null;
  traceId?: string;
};

export type IngestionResult = {
  sourceId: string;
  workspaceId: string;
  createdCount: number;
  skippedCount: number;
  durationMs: number;
  traceId?: string | null;
};

export type SourceConnector = {
  type: SourceType;
  supportsRefresh: boolean;
  refresh: (input: IngestionRefreshInput) => Promise<IngestionResult>;
};
