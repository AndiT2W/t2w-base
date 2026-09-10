#!/usr/bin/env node
import { readFile } from "node:fs/promises";

const [inputPath, ...flags] = process.argv.slice(2);
if (!inputPath) {
  console.error(
    "Usage: node scripts/import-clickup-payouts.mjs <clickup-export.json> [--commit] [--base-url URL]",
  );
  process.exitCode = 2;
} else {
  const baseUrl =
    flags.find((flag) => flag.startsWith("--base-url="))?.slice(11) ?? "http://127.0.0.1:3000";
  const commit = flags.includes("--commit");
  const parsed = JSON.parse(await readFile(inputPath, "utf8"));
  const rows = Array.isArray(parsed) ? parsed : parsed.rows;
  if (!Array.isArray(rows))
    throw new Error("Export must be an array or an object with a rows array");
  const response = await fetch(`${baseUrl}/api/v1/payouts/import`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rows, preview: !commit }),
  });
  const body = await response.json();
  if (!response.ok) throw new Error(`${response.status}: ${JSON.stringify(body)}`);
  console.log(JSON.stringify(body, null, 2));
}
