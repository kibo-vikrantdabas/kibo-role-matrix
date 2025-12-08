/**
 * Excel and CSV Writer Module
 * Provides utility functions for writing data to CSV and Excel (.xlsx) files.
 * Includes timestamp generation for file naming.
 *
 * @module excelWriter
 * @exports writeExcel - Write array-of-arrays data to Excel file
 * @exports getTimestamp - Generate timestamp string in dd-mm-yyyy-hh-mm-ss-ssss format
 */

import * as path from "path";

/**
 * Generate a timestamp string for file naming.
 * Format: dd-mm-yyyy-hh-mm-ss-ssss (e.g., 01-12-2025-14-30-45-1234)
 *
 * @returns {string} Formatted timestamp string
 *
 * @example
 * const ts = getTimestamp();
 * // Returns: "01-12-2025-14-30-45-1234"
 */
export function getTimestamp(): string {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = now.getFullYear();
  const hh = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");
  const ssss = String(now.getMilliseconds()).padStart(4, "0");
  return `${dd}-${mm}-${yyyy}-${hh}-${min}-${ss}-${ssss}`;
}

// CSV writing moved to `src/csvWriter.ts` to separate responsibilities.

/**
 * Write data to an Excel (.xlsx) file.
 * Creates a new workbook with a single sheet named "Users" containing the data.
 *
 * @async
 * @param {Array<Array<string>>} rows - Array of rows, each row is an array of cell values
 * @param {string} outPath - Output file path
 * @returns {Promise<void>}
 * @throws {Error} If xlsx module is not available or write fails
 *
 * @example
 * const rows = [
 *   ["email", "firstName", "lastName", "id", "roles"],
 *   ["user@example.com", "John", "Doe", "123", "Admin;User"]
 * ];
 * await writeExcel(rows, "output.xlsx");
 */
export async function writeExcel(rows: Array<Array<string>>, outPath: string) {
  const xlsx = await import("xlsx");
  const ws = xlsx.utils.aoa_to_sheet(rows);
  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, ws, "Users");
  xlsx.writeFile(wb, outPath);
}
