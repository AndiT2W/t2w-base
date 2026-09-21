import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import {
  ClickUpEventImportService,
  type ClickUpTaskRecord,
  mergeClickUpTaskSnapshots,
} from "./clickup-event-import.js";

type ListSnapshot = { tasks?: ClickUpTaskRecord[] };
type DetailSnapshot = { records?: ClickUpTaskRecord[] };

const importDirectory = process.argv[2];
if (!importDirectory) {
  throw new Error("Usage: node dist/import-clickup-events.js <clickup-snapshot-directory>");
}

const parseJson = async <T>(filePath: string): Promise<T> =>
  JSON.parse(await readFile(filePath, "utf8")) as T;

const entries = await readdir(importDirectory);
const listFile = entries.find((entry) => entry.endsWith("-live-list.json"));
if (!listFile) throw new Error("Missing ClickUp list snapshot.");

const listSnapshot = await parseJson<ListSnapshot>(path.join(importDirectory, listFile));
if (!Array.isArray(listSnapshot.tasks)) throw new Error("Invalid ClickUp list snapshot.");

const detailFiles = entries.filter((entry) => /-live-\d{3}\.json$/.test(entry)).sort();
const detailSnapshots = await Promise.all(
  detailFiles.map((file) => parseJson<DetailSnapshot>(path.join(importDirectory, file))),
);
const detailedTasks = detailSnapshots.flatMap((snapshot) =>
  Array.isArray(snapshot.records) ? snapshot.records : [],
);

const prisma = new PrismaClient();
try {
  const service = new ClickUpEventImportService(prisma);
  const report = await service.run(mergeClickUpTaskSnapshots(listSnapshot.tasks, detailedTasks));
  console.log(JSON.stringify({ ...report, detailedTasks: detailedTasks.length }));
  if (report.errors.length) process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
