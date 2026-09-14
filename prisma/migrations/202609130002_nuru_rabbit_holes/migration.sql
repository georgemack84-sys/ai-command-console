CREATE TABLE "NuruRabbitHole" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "subtitle" TEXT NOT NULL,
  "coverKey" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "NuruRabbitHole_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "NuruRabbitHoleStep" (
  "id" TEXT NOT NULL,
  "rabbitHoleId" TEXT NOT NULL,
  "position" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  CONSTRAINT "NuruRabbitHoleStep_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "NuruRabbitHoleStep_rabbitHoleId_fkey" FOREIGN KEY ("rabbitHoleId") REFERENCES "NuruRabbitHole"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "NuruRabbitHoleProgress" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "rabbitHoleId" TEXT NOT NULL,
  "completedSteps" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "NuruRabbitHoleProgress_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "NuruRabbitHoleProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "NuruRabbitHoleProgress_rabbitHoleId_fkey" FOREIGN KEY ("rabbitHoleId") REFERENCES "NuruRabbitHole"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "NuruRabbitHoleStep_rabbitHoleId_position_key" ON "NuruRabbitHoleStep"("rabbitHoleId", "position");
CREATE UNIQUE INDEX "NuruRabbitHoleProgress_userId_rabbitHoleId_key" ON "NuruRabbitHoleProgress"("userId", "rabbitHoleId");
CREATE INDEX "NuruRabbitHoleProgress_userId_updatedAt_idx" ON "NuruRabbitHoleProgress"("userId", "updatedAt");
