/**
 * CSV Writer Module
 * Contains CSV-specific writing logic separated from Excel writer.
 * Exports a simple `writeCsv` helper that takes array-of-arrays and an output path.
 */

import * as fs from "fs";

/**
 * Write data to a CSV file with proper escaping.
 * Cells containing quotes are escaped by doubling them.
 * All cells are wrapped in double quotes for safety.
 *
 * @async
 * @param {Array<Array<string>>} rows - Array of rows, each row is an array of cell values
 * @param {string} outPath - Output file path
 */
export async function writeCsv(rows: Array<Array<string>>, outPath: string) {
  const escapeCell = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
  const csv = rows.map((r) => r.map(escapeCell).join(",")).join("\n");
  await fs.promises.writeFile(outPath, csv, "utf8");
}
