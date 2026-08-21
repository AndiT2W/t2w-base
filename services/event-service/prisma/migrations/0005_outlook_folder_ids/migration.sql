ALTER TABLE "Event" ADD COLUMN "outlookMailbox" TEXT;
ALTER TABLE "Event" ADD COLUMN "outlookRootFolderId" TEXT;
ALTER TABLE "Event" ADD COLUMN "outlookYearFolderId" TEXT;
ALTER TABLE "Event" ADD COLUMN "outlookQuarterFolderId" TEXT;
ALTER TABLE "Event" ADD COLUMN "outlookFolderId" TEXT;
ALTER TABLE "Event" ADD COLUMN "outlookFolderSyncStatus" "SyncStatus" NOT NULL DEFAULT 'NEVER';
ALTER TABLE "Event" ADD COLUMN "outlookFolderLastSuccessAt" TIMESTAMP(3);
ALTER TABLE "Event" ADD COLUMN "outlookFolderLastError" TEXT;
