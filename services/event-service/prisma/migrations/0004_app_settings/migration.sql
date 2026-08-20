CREATE TABLE "AppSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "outlookStammordner" TEXT NOT NULL DEFAULT 'Auftraege26',
    "outlookJahresordner" JSONB NOT NULL DEFAULT '[]',
    "jahresSites" JSONB NOT NULL DEFAULT '[]',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AppSettings_pkey" PRIMARY KEY ("id")
);
