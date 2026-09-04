CREATE TABLE "authority_ledger_events" (
    "event_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "authority_id" TEXT NOT NULL,
    "related_authority_id" TEXT,
    "reason" TEXT NOT NULL,
    "authority_record" JSONB,
    "previous_authority_type" TEXT,
    "new_authority_type" TEXT,
    "authorized_by" TEXT,
    "evidence_ids" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "authority_ledger_events_pkey" PRIMARY KEY ("event_id")
);

CREATE INDEX "authority_ledger_events_authority_id_occurred_at_idx" ON "authority_ledger_events"("authority_id", "occurred_at");
CREATE INDEX "authority_ledger_events_related_authority_id_occurred_at_idx" ON "authority_ledger_events"("related_authority_id", "occurred_at");
