CREATE TABLE "authority_review_requests" (
    "review_id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "authority_record" JSONB NOT NULL,
    "reason_code" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),
    "resolved_by" TEXT,
    CONSTRAINT "authority_review_requests_pkey" PRIMARY KEY ("review_id")
);

CREATE INDEX "authority_review_requests_workspace_id_status_requested_at_idx" ON "authority_review_requests"("workspace_id", "status", "requested_at");
