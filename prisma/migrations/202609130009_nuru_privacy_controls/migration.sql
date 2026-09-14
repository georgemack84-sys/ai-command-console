CREATE TABLE "NuruPrivacySettings" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "personalizationPaused" BOOLEAN NOT NULL DEFAULT false,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "NuruPrivacySettings_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "NuruPrivacySettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "NuruPrivacySettings_userId_key" ON "NuruPrivacySettings"("userId");
