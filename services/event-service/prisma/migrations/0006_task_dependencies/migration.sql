ALTER TABLE "EventTask" ADD COLUMN "dependsOnTaskId" UUID;

ALTER TABLE "EventTask" ADD CONSTRAINT "EventTask_dependsOnTaskId_fkey" FOREIGN KEY ("dependsOnTaskId") REFERENCES "EventTask" ("id") ON DELETE SET NULL;