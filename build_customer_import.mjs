import fs from "node:fs/promises";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const data = JSON.parse(await fs.readFile("./invoice_customers.json", "utf8"));
const outDir = "./outputs/invoice-import";
await fs.mkdir(outDir, { recursive: true });
const wb = Workbook.create();
const sh = wb.worksheets.add("Kunden Import");
const headers = [
  "ID (leer lassen)",
  "Name",
  "Typ",
  "Land",
  "Ort",
  "Straße",
  "Postleitzahl",
  "UID",
  "IBAN",
  "BIC",
  "Bank",
  "E-Mail",
  "Primärkontakt",
  "Rechnungsnummern",
  "Quellrechnungen",
  "Hinweise",
];
const fix = (value) =>
  String(value ?? "")
    .replace(/\ufffdsterreich/g, "Österreich")
    .replace(/Stra\ufffde/g, "Straße")
    .replace(/M\ufffdhlbach/g, "Mühlbach")
    .replace(/F\ufffdrderkreis/g, "Förderkreis")
    .replace(/Andr\ufffd/g, "André")
    .replace(/H\ufffdglw\ufffdrth/g, "Höglwörth")
    .replace(/K\ufffdnig/g, "König")
    .replace(/\ufffd/g, "");
const rows = data.customers.map((c) => {
  let street = fix(c.street),
    city = fix(c.city),
    postal = fix(c.postal_code),
    country = fix(c.country);
  const m = street.match(/^(.+?),\s*(\d{4,5})\s+([^,]+),?\s*$/);
  if (m && !postal && !city) {
    street = m[1];
    postal = m[2];
    city = m[3];
  }
  return [
    "",
    ...[
      c.customer_name,
      c.type,
      country,
      city,
      street,
      postal,
      c.uid,
      c.iban,
      c.bic,
      c.bankName,
      c.email,
      c.primary_contact,
      c.source_invoices,
      c.source_files,
      c.notes,
    ].map(fix),
  ];
});
sh.getRange(`A1:P${rows.length + 1}`).values = [headers, ...rows];
sh.getRange("A1:P1").format = {
  fill: "#0F766E",
  font: { bold: true, color: "#FFFFFF" },
  wrapText: true,
  borders: { preset: "outside", style: "thin", color: "#0F766E" },
};
sh.getRange(`A2:P${rows.length + 1}`).format = {
  borders: { preset: "insideHorizontal", style: "thin", color: "#D9E2E8" },
  wrapText: true,
};
sh.getRange(`A1:P${rows.length + 1}`).format.font = { name: "Aptos", size: 10 };
sh.getRange("A1:P1").format.font = {
  name: "Aptos Display",
  size: 10,
  bold: true,
  color: "#FFFFFF",
};
sh.getRange(`A2:A${rows.length + 1}`).format.fill = "#FFF7ED";
sh.getRange(`P2:P${rows.length + 1}`).format.fill = "#FEF2F2";
sh.getRange(`A1:P${rows.length + 1}`).format.autofitColumns();
for (const [col, width] of [
  ["A", 16],
  ["B", 34],
  ["C", 16],
  ["D", 16],
  ["E", 22],
  ["F", 30],
  ["G", 14],
  ["H", 18],
  ["I", 24],
  ["J", 16],
  ["K", 22],
  ["L", 28],
  ["M", 26],
  ["N", 24],
  ["O", 58],
  ["P", 38],
])
  sh.getRange(`${col}:${col}`).format.columnWidth = width;
sh.getRange(`A1:P${rows.length + 1}`).format.autofitRows();
sh.getRange(`A2:P${rows.length + 1}`).format.rowHeight = 30;
sh.freezePanes.freezeRows(1);
sh.showGridLines = false;
sh.tables.add(`A1:P${rows.length + 1}`, true, "KundenImportTable");

const note = wb.worksheets.add("Hinweise");
note.getRange("A1:B8").values = [
  ["Kundenimport für t2w-base", ""],
  ["Quelle", "PDF-Rechnungen aus raw/03_rechnungen"],
  ["Ausgewertete PDF-Rechnungen", data.invoice_count],
  ["Extrahierte eindeutige Kunden", data.customer_count],
  ["Importziel", "Organizer/Kunden-Stammdaten"],
  ["Hinweis", "Die Spalte „ID (leer lassen)“ wird beim Import vom System erzeugt."],
  [
    "Qualität",
    "Nicht eindeutig extrahierte UID, Länder oder Adressen sind in „Hinweise“ markiert.",
  ],
  [
    "Duplikate",
    "Zusammengeführt nach normalisiertem Namen und Adresse; alle Rechnungsquellen bleiben dokumentiert.",
  ],
];
note.getRange("A1:B1").merge();
note.getRange("A1:B1").format = {
  fill: "#0F766E",
  font: { bold: true, color: "#FFFFFF", size: 14 },
};
note.getRange("A2:A8").format = { fill: "#E6FFFA", font: { bold: true } };
note.getRange("A1:B8").format.wrapText = true;
note.getRange("A1:B8").format.borders = { preset: "outside", style: "thin", color: "#CBD5E1" };
note.getRange("A:A").format.columnWidth = 30;
note.getRange("B:B").format.columnWidth = 100;
note.getRange("A1:B8").format.autofitRows();
note.showGridLines = false;

const check = await wb.inspect({
  kind: "table",
  range: `Kunden Import!A1:P8`,
  include: "values,formulas",
  tableMaxRows: 8,
  tableMaxCols: 16,
});
console.log(check.ndjson);
const errors = await wb.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 300 },
  summary: "final formula error scan",
});
console.log(errors.ndjson);
for (const [sheetName, range, file] of [
  ["Kunden Import", `A1:P12`, "kunden-import-preview.png"],
  ["Hinweise", "A1:B8", "hinweise-preview.png"],
]) {
  const blob = await wb.render({ sheetName, range, scale: 1, format: "png" });
  await fs.writeFile(`${outDir}/${file}`, new Uint8Array(await blob.arrayBuffer()));
}
const xlsx = await SpreadsheetFile.exportXlsx(wb);
await xlsx.save(`${outDir}/t2w-kunden-import.xlsx`);
console.log(`saved ${outDir}/t2w-kunden-import.xlsx`);
