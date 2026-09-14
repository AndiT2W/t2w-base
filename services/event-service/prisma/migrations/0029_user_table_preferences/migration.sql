CREATE TABLE "UserTablePreference" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "tableId" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserTablePreference_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserTablePreference_userId_tableId_key"
ON "UserTablePreference"("userId", "tableId");

CREATE INDEX "UserTablePreference_userId_updatedAt_idx"
ON "UserTablePreference"("userId", "updatedAt");

ALTER TABLE "UserTablePreference"
ADD CONSTRAINT "UserTablePreference_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
