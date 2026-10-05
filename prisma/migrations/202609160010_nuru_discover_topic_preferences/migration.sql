CREATE TABLE "NuruDiscoverTopicPreference" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "topic" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "NuruDiscoverTopicPreference_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "NuruDiscoverTopicPreference_userId_topic_key"
  ON "NuruDiscoverTopicPreference"("userId", "topic");
CREATE INDEX "NuruDiscoverTopicPreference_userId_updatedAt_idx"
  ON "NuruDiscoverTopicPreference"("userId", "updatedAt");

ALTER TABLE "NuruDiscoverTopicPreference"
  ADD CONSTRAINT "NuruDiscoverTopicPreference_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
