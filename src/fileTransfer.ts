/**
 * File Transfer Module
 * Handles local file storage and SFTP transfer of generated CSV/Excel files.
 * Supports conditional file transfer based on environment variables.
 *
 * Environment Variables:
 * - LOCAL_TRANSFER: Set to "true" to save files locally (default: "true")
 * - LOCAL_OUTPUT_PATH: Local directory path for saving files (default: "output")
 * - SFTP_TRANSFER: Set to "true" to transfer files to SFTP server (default: "false")
 * - SFTP_HOST: SFTP server hostname (required if SFTP_TRANSFER=true)
 * - SFTP_PORT: SFTP server port (default: 22)
 * - SFTP_USERNAME: SFTP username (required if SFTP_TRANSFER=true)
 * - SFTP_PASSWORD: SFTP password (required if SFTP_TRANSFER=true)
 * - SFTP_REMOTE_PATH: Remote directory path on SFTP server (required if SFTP_TRANSFER=true)
 *
 * @module fileTransfer
 * @exports getFileTransferConfig - Get file transfer configuration from environment
 * @exports ensureLocalDirectory - Create local output directory if needed
 * @exports transferFileToSftp - Transfer a file to SFTP server
 * @exports handleFileTransfer - Main orchestrator for local and SFTP file transfer
 */

import * as fs from "fs";
import * as path from "path";

/**
 * File transfer configuration object
 * @typedef {Object} FileTransferConfig
 * @property {boolean} localTransfer - Whether to save files locally
 * @property {string} localOutputPath - Local directory path for output files
 * @property {boolean} sftpTransfer - Whether to transfer files to SFTP
 * @property {string|null} sftpHost - SFTP server hostname
 * @property {number} sftpPort - SFTP server port
 * @property {string|null} sftpUsername - SFTP username
 * @property {string|null} sftpPassword - SFTP password
 * @property {string|null} sftpRemotePath - Remote directory path on SFTP server
 */
export interface FileTransferConfig {
  localTransfer: boolean;
  localOutputPath: string;
  sftpTransfer: boolean;
  sftpHost: string | null;
  sftpPort: number;
  sftpUsername: string | null;
  sftpPassword: string | null;
  sftpRemotePath: string | null;
}

/**
 * Parse and validate file transfer configuration from environment variables.
 * Provides sensible defaults and validates SFTP settings when enabled.
 *
 * @returns {FileTransferConfig} File transfer configuration object
 * @throws {Error} If SFTP_TRANSFER is true but required SFTP variables are missing
 *
 * @example
 * const config = getFileTransferConfig();
 * // Returns: {
 * //   localTransfer: true,
 * //   localOutputPath: "/path/to/output",
 * //   sftpTransfer: false,
 * //   sftpHost: null,
 * //   sftpPort: 22,
 * //   ...
 * // }
 */
export function getFileTransferConfig(): FileTransferConfig {
  const localTransfer =
    (process.env.LOCAL_TRANSFER || "true").toLowerCase() === "true";
  const localOutputPath = process.env.LOCAL_OUTPUT_PATH || "output";
  const sftpTransfer =
    (process.env.SFTP_TRANSFER || "false").toLowerCase() === "true";
  const sftpHost = process.env.SFTP_HOST || null;
  const sftpPort = parseInt(process.env.SFTP_PORT || "22", 10);
  const sftpUsername = process.env.SFTP_USERNAME || null;
  const sftpPassword = process.env.SFTP_PASSWORD || null;
  const sftpRemotePath = process.env.SFTP_REMOTE_PATH || null;

  // Validate SFTP configuration if enabled
  if (sftpTransfer) {
    const missing = [];
    if (!sftpHost) missing.push("SFTP_HOST");
    if (!sftpUsername) missing.push("SFTP_USERNAME");
    if (!sftpPassword) missing.push("SFTP_PASSWORD");
    if (!sftpRemotePath) missing.push("SFTP_REMOTE_PATH");

    if (missing.length > 0) {
      throw new Error(
        `SFTP_TRANSFER is enabled but missing required environment variables: ${missing.join(
          ", "
        )}`
      );
    }
  }

  return {
    localTransfer,
    localOutputPath,
    sftpTransfer,
    sftpHost,
    sftpPort,
    sftpUsername,
    sftpPassword,
    sftpRemotePath,
  };
}

/**
 * Ensure local output directory exists.
 * Creates the directory recursively if it doesn't exist.
 *
 * @async
 * @param {string} dirPath - Directory path to create
 * @returns {Promise<void>}
 * @throws {Error} If directory creation fails
 *
 * @example
 * await ensureLocalDirectory("output");
 * // Directory ./output is now created if it didn't exist
 */
export async function ensureLocalDirectory(dirPath: string): Promise<void> {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`Created directory: ${dirPath}`);
    }
  } catch (err) {
    throw new Error(`Failed to create directory ${dirPath}: ${err}`);
  }
}

/**
 * Transfer a file to an SFTP server.
 * Requires the 'ssh2-sftp-client' package to be installed.
 *
 * @async
 * @param {string} localFilePath - Full path to local file to transfer
 * @param {string} remoteFileName - Name of the file on remote server (without path)
 * @param {FileTransferConfig} config - SFTP configuration from getFileTransferConfig()
 * @returns {Promise<void>}
 * @throws {Error} If SFTP transfer fails or ssh2-sftp-client is not available
 *
 * @description
 * Process:
 * 1. Dynamically import ssh2-sftp-client
 * 2. Create SFTP client connection
 * 3. Connect to SFTP server with credentials
 * 4. Upload file to remote path
 * 5. Close connection
 * 6. Log success message
 *
 * @example
 * const config = getFileTransferConfig();
 * await transferFileToSftp(
 *   "/local/path/users-51679-01-12-2025-14-30-45-1234.csv",
 *   "users-51679-01-12-2025-14-30-45-1234.csv",
 *   config
 * );
 */
export async function transferFileToSftp(
  localFilePath: string,
  remoteFileName: string,
  config: FileTransferConfig
): Promise<void> {
  try {
    // Dynamically import ssh2-sftp-client
    const Client = (await import("ssh2-sftp-client")).default;
    const client = new Client();

    // Connect to SFTP server
    await client.connect({
      host: config.sftpHost!,
      port: config.sftpPort,
      username: config.sftpUsername!,
      password: config.sftpPassword!,
    });

    // Upload file to remote path
    const remotePath = `${config.sftpRemotePath}/${remoteFileName}`;
    await client.put(localFilePath, remotePath);

    // Close connection
    await client.end();

    console.log(
      `SFTP transfer successful: ${localFilePath} -> ${config.sftpHost}:${remotePath}`
    );
  } catch (err) {
    throw new Error(`SFTP transfer failed: ${err}`);
  }
}

/**
 * Main orchestrator for file transfer operations.
 * Handles both local file saving and SFTP transfer based on configuration.
 * First saves locally (if enabled), then transfers to SFTP (if enabled).
 *
 * @async
 * @param {string} filePath - Full path to the file created locally
 * @param {string} fileName - Base filename (e.g., "users-51679-01-12-2025-14-30-45-1234.csv")
 * @param {FileTransferConfig} config - File transfer configuration from getFileTransferConfig()
 * @returns {Promise<{success: boolean, localPath: string|null, remotePath: string|null, messages: string[]}>}
 *          Transfer results with success flag and file paths
 *
 * @description
 * Process:
 * 1. If LOCAL_TRANSFER=true:
 *    a. Ensure local directory exists
 *    b. Log local file location
 * 2. If SFTP_TRANSFER=true:
 *    a. Transfer file to SFTP server
 *    b. Log SFTP transfer status
 * 3. Return combined results
 *
 * @example
 * const config = getFileTransferConfig();
 * const result = await handleFileTransfer(
 *   "/output/users-51679-01-12-2025-14-30-45-1234.csv",
 *   "users-51679-01-12-2025-14-30-45-1234.csv",
 *   config
 * );
 * // Returns: {
 * //   success: true,
 * //   localPath: "/output/users-51679-01-12-2025-14-30-45-1234.csv",
 * //   remotePath: "sftp.example.com:/uploads/users-51679-01-12-2025-14-30-45-1234.csv",
 * //   messages: ["File saved locally...", "SFTP transfer successful..."]
 * // }
 */
export async function handleFileTransfer(
  filePath: string,
  fileName: string,
  config: FileTransferConfig
): Promise<{
  success: boolean;
  localPath: string | null;
  remotePath: string | null;
  messages: string[];
}> {
  const messages: string[] = [];
  let localPath: string | null = null;
  let remotePath: string | null = null;
  let success = true;

  try {
    // Handle local file storage
    if (config.localTransfer) {
      await ensureLocalDirectory(config.localOutputPath);
      localPath = filePath;
      messages.push(`✓ File saved locally: ${filePath}`);
    }

    // Handle SFTP transfer
    if (config.sftpTransfer) {
      await transferFileToSftp(filePath, fileName, config);
      remotePath = `${config.sftpHost}:${config.sftpRemotePath}/${fileName}`;
      messages.push(`✓ File transferred to SFTP: ${remotePath}`);
    }

    // Log all messages
    messages.forEach((msg) => console.log(msg));
  } catch (err) {
    success = false;
    const errorMsg = `✗ File transfer error: ${err}`;
    messages.push(errorMsg);
    console.error(errorMsg);
  }

  return { success, localPath, remotePath, messages };
}
