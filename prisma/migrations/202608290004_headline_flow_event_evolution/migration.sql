ALTER TABLE "headline_flow_events"
  ADD COLUMN "updateSummary" TEXT NOT NULL DEFAULT 'Event continuity updated.',
  ADD COLUMN "updateReasons" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
