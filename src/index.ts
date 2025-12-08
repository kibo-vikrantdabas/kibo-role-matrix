/**
 * Main Application Entry Point
 * Orchestrates the user data collection and export process across multiple tenants.
 *
 * This script:
 * 1. Reads tenant IDs from the INPUT_TENANTS_IDS or TENANTS environment variable
 * 2. For each tenant, fetches all users across all sites in batches of 50
 * 3. Enriches each user with their role information
 * 4. Exports the data in CSV and/or Excel format based on OUTPUT_FORMAT
 * 5. Saves files locally and/or transfers to SFTP based on configuration
 *
 * Environment Variables:
 * - INPUT_TENANTS_IDS or TENANTS: Comma-separated list of tenant IDs (default: "51679")
 * - OUTPUT_FORMAT: Comma-separated output formats: "csv", "xlsx", or both (default: "csv")
 * - LOCAL_TRANSFER: Save files locally (default: "true")
 * - LOCAL_OUTPUT_PATH: Local directory path for files (default: "output")
 * - SFTP_TRANSFER: Transfer files to SFTP server (default: "false")
 * - SFTP_HOST: SFTP server hostname (required if SFTP_TRANSFER=true)
 * - SFTP_PORT: SFTP server port (default: 22)
 * - SFTP_USERNAME: SFTP username (required if SFTP_TRANSFER=true)
 * - SFTP_PASSWORD: SFTP password (required if SFTP_TRANSFER=true)
 * - SFTP_REMOTE_PATH: Remote directory path on SFTP server (required if SFTP_TRANSFER=true)
 *
 * Output File Format:
 * - users-<tenantId>-<dd-mm-yyyy-hh-mm-ss-ssss>.csv
 * - users-<tenantId>-<dd-mm-yyyy-hh-mm-ss-ssss>.xlsx
 *
 * @module index
 * @requires ./user/role/users - User data fetching functions
 * @requires ./excelWriter - CSV and Excel file writers
 * @requires ./fileTransfer - File transfer and storage management
 * @requires dotenv - Environment variable loading
 */

/* tslint:disable */
/* eslint-disable */

import { fetchAllTenantUsers } from "./user/role/users";
import { writeCsv } from "./csvWriter";
import { writeExcel, getTimestamp } from "./excelWriter";
import {
  getFileTransferConfig,
  ensureLocalDirectory,
  handleFileTransfer,
  type FileTransferConfig,
} from "./fileTransfer";

import dotenv from "dotenv";
dotenv.config();

const path = require("path");
const fs = require("node:fs");

/**
 * Main execution function.
 * Processes each tenant, fetches users, enriches with roles, exports data,
 * and handles file transfer (local and/or SFTP).
 * Runs asynchronously with comprehensive error handling per tenant.
 */
(async function main() {
  try {
    // Load file transfer configuration from environment
    let fileTransferConfig: FileTransferConfig;
    try {
      fileTransferConfig = getFileTransferConfig();
      console.log("File transfer configuration loaded successfully");
    } catch (configErr) {
      console.error("Failed to load file transfer config:", configErr);
      process.exitCode = 1;
      return;
    }

    // Ensure local output directory exists if local transfer is enabled
    if (fileTransferConfig.localTransfer) {
      const projectRoot = path.join(__dirname, "..");
      const localOutputPath = path.join(
        projectRoot,
        fileTransferConfig.localOutputPath
      );
      await ensureLocalDirectory(localOutputPath);
    }

    // Determine single tenant and parse output format preferences
    const tenantId = (
      process.env.KIBO_TENANT ||
      process.env.INPUT_TENANTS_IDS ||
      process.env.TENANTS ||
      "51679"
    ).toString();
    // Parse output format preferences
    const outputFormat = (process.env.OUTPUT_FORMAT || "csv")
      .toLowerCase()
      .split(",")
      .map((s) => s.trim());

    // Generate timestamp once for all files in this run
    const timestamp = getTimestamp();

    // Process the single configured tenant
    console.log(`\n========== Processing tenant ${tenantId} ==========`);
    try {
      // Fetch users for the tenant (for the configured site)
      const users = await fetchAllTenantUsers(tenantId);

      // Initialize rows with header
      const header = ["email", "firstName", "lastName", "id", "roles"];
      const rows: Array<Array<string>> = [header];

      // Load AdminUserApi and configuration for role fetching
      // Using require for compatibility with runtime
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const {
        AdminUserApi,
      } = require("@kibocommerce/rest-sdk/clients/AdminUser/apis/AdminUserApi");
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { configuration } = require("./config");
      const adminUserClient = new AdminUserApi(configuration);

      // Enrich each user with their role information
      for (const u of users) {
        const userId = u?.id;
        if (!userId) continue;

        let roleNames: string[] = [];
        try {
          // Fetch roles for this user
          const rolesResp = await adminUserClient.getUserRoles({
            userId: String(userId),
          });
          const items = rolesResp?.items ?? [];
          roleNames = items
            .map((r: any) => r?.roleName)
            .filter((x: any) => !!x);
        } catch {
          // Mark as error if role fetch fails
          roleNames = ["ERROR"];
        }

        // Add user row with roles joined by semicolon
        rows.push([
          u.email || "",
          u.firstName || "",
          u.lastName || "",
          String(userId),
          roleNames.join(";"),
        ]);
      }

      // Write CSV file if requested
      if (outputFormat.includes("csv")) {
        const projectRoot = path.join(__dirname, "..");
        const localOutputPath = path.join(
          projectRoot,
          fileTransferConfig.localOutputPath
        );
        const csvPath = `${localOutputPath}/users-${tenantId}-${timestamp}.csv`;
        await writeCsv(rows, csvPath);
        console.log(`CSV written for tenant ${tenantId}:`, csvPath);

        // Handle file transfer (local and/or SFTP)
        const csvFileName = path.basename(csvPath);
        await handleFileTransfer(csvPath, csvFileName, fileTransferConfig);
      }

      // Write Excel file if requested
      if (outputFormat.includes("xlsx")) {
        const projectRoot = path.join(__dirname, "..");
        const localOutputPath = path.join(
          projectRoot,
          fileTransferConfig.localOutputPath
        );
        const xlsxPath = `${localOutputPath}/users-${tenantId}-${timestamp}.xlsx`;
        await writeExcel(rows, xlsxPath);
        console.log(`Excel written for tenant ${tenantId}:`, xlsxPath);

        // Handle file transfer (local and/or SFTP)
        const xlsxFileName = path.basename(xlsxPath);
        await handleFileTransfer(xlsxPath, xlsxFileName, fileTransferConfig);
      }
    } catch (err) {
      console.error(`Error processing tenant ${tenantId}`, err);
    }
  } catch (err) {
    console.error("Unexpected error in main", err);
    process.exitCode = 1;
  }
})();
