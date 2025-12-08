# User Role Matrix - File Transfer Documentation

This document describes the file transfer capabilities of the User Role Matrix application.

## Overview

The application supports two file transfer mechanisms:

1. **Local Transfer**: Save generated CSV/Excel files to a local directory
2. **SFTP Transfer**: Automatically transfer files to a remote SFTP server

Both can be enabled/disabled independently via environment variables.

## Configuration

All file transfer settings are configured through environment variables. See `.env.example` for a complete example.

### Local Transfer

**Environment Variables:**

- `LOCAL_TRANSFER` (default: `true`)

  - Set to `"true"` to save files locally
  - Set to `"false"` to disable local storage

- `LOCAL_OUTPUT_PATH` (default: `output`)
  - Local directory path for saving files
  - Path is relative to the project root
  - Directory is created automatically if it doesn't exist

**Example:**

```env
LOCAL_TRANSFER=true
LOCAL_OUTPUT_PATH=output
```

### SFTP Transfer

**Environment Variables:**

- `SFTP_TRANSFER` (default: `false`)

  - Set to `"true"` to enable SFTP file transfer
  - Set to `"false"` to disable SFTP transfer

- `SFTP_HOST` (required if `SFTP_TRANSFER=true`)

  - SFTP server hostname or IP address
  - Example: `sftp.example.com`

- `SFTP_PORT` (default: `22`)

  - SFTP server port number
  - Standard SSH/SFTP port is 22

- `SFTP_USERNAME` (required if `SFTP_TRANSFER=true`)

  - SFTP account username for authentication

- `SFTP_PASSWORD` (required if `SFTP_TRANSFER=true`)

  - SFTP account password for authentication
  - ⚠️ Store securely, never commit to version control

- `SFTP_REMOTE_PATH` (required if `SFTP_TRANSFER=true`)
  - Remote directory path on SFTP server
  - Do not include trailing slash
  - Example: `/uploads/user-data`

**Example:**

```env
SFTP_TRANSFER=true
SFTP_HOST=sftp.example.com
SFTP_PORT=22
SFTP_USERNAME=myuser
SFTP_PASSWORD=mypassword
SFTP_REMOTE_PATH=/uploads/user-data
```

## Dependencies

### Required

- Core dependencies (already installed)

### Optional

- `ssh2-sftp-client` (required only if `SFTP_TRANSFER=true`)
  - Install with: `npm install ssh2-sftp-client`

## File Transfer Process

### Flow Diagram

```
Application Start
    ↓
Load File Transfer Config
    ↓
Validate Settings
    ↓
Ensure Local Directory Exists (if LOCAL_TRANSFER=true)
    ↓
Process Each Tenant
    ├─ Fetch Users
    ├─ Enrich with Roles
    ├─ Generate CSV/Excel
    ├─ Save Locally (if LOCAL_TRANSFER=true)
    │  └─ File saved to LOCAL_OUTPUT_PATH
    └─ Transfer to SFTP (if SFTP_TRANSFER=true)
       └─ File uploaded to SFTP_REMOTE_PATH
```

### Local Transfer Process

1. Ensure `LOCAL_OUTPUT_PATH` directory exists (created if needed)
2. Write CSV/Excel file to the local directory
3. Log success message with file path

### SFTP Transfer Process

1. Connect to SFTP server with provided credentials
2. Upload file to remote path: `SFTP_REMOTE_PATH/<filename>`
3. Close SFTP connection
4. Log success message with server details

### Error Handling

- **Local Transfer Errors**: Application logs error but continues
- **SFTP Transfer Errors**: Application logs error but continues to next file
- **Configuration Errors**: Application exits with error code 1

## Examples

### Example 1: Local Storage Only (Default)

**Configuration:**

```env
LOCAL_TRANSFER=true
LOCAL_OUTPUT_PATH=output
SFTP_TRANSFER=false
```

**Result:**

- Files saved to `./output/users-<tenantId>-<timestamp>.csv`
- No SFTP transfer attempted

### Example 2: SFTP Transfer Only

**Configuration:**

```env
LOCAL_TRANSFER=false
SFTP_TRANSFER=true
SFTP_HOST=sftp.example.com
SFTP_PORT=22
SFTP_USERNAME=myuser
SFTP_PASSWORD=mypass
SFTP_REMOTE_PATH=/uploads
```

**Result:**

- Files NOT saved locally
- Files uploaded to `sftp.example.com:/uploads/users-<tenantId>-<timestamp>.csv`

### Example 3: Both Local and SFTP

**Configuration:**

```env
LOCAL_TRANSFER=true
LOCAL_OUTPUT_PATH=output
SFTP_TRANSFER=true
SFTP_HOST=sftp.example.com
SFTP_USERNAME=myuser
SFTP_PASSWORD=mypass
SFTP_REMOTE_PATH=/uploads
```

**Result:**

- Files saved locally to `./output/users-<tenantId>-<timestamp>.csv`
- Files also uploaded to `sftp.example.com:/uploads/users-<tenantId>-<timestamp>.csv`

## File Naming

Output files follow the naming convention:

```
users-<tenantId>-<dd-mm-yyyy-hh-mm-ss-ssss>.<ext>
```

Examples:

- `users-51679-01-12-2025-14-30-45-1234.csv`
- `users-51679-01-12-2025-14-30-45-1234.xlsx`
- `users-12345-01-12-2025-14-30-45-9876.csv`

## Security Considerations

⚠️ **Important Security Notes:**

1. **Never commit `.env` file** to version control if it contains passwords
2. **Use environment variables** for sensitive data in production
3. **Restrict file permissions** on local output directory
4. **Use SSH keys** instead of passwords if SFTP server supports it
5. **Encrypt connections** - Ensure SFTP uses port 22 (SSH/TLS)

### Best Practices

- Store credentials in a secure secrets management system
- Use separate credentials for SFTP per environment
- Regularly rotate SFTP passwords
- Log SFTP transfers for audit purposes
- Restrict SFTP account to specific directory paths

## Troubleshooting

### Local Transfer Issues

**Problem:** "Failed to create directory"

- Check file permissions on parent directory
- Ensure path is writable

**Problem:** "Permission denied" when writing file

- Check directory permissions
- Ensure sufficient disk space

### SFTP Transfer Issues

**Problem:** "Module 'ssh2-sftp-client' not found"

- Run: `npm install ssh2-sftp-client`
- Ensure package is in dependencies

**Problem:** "Connection refused"

- Check SFTP_HOST is correct
- Verify SFTP_PORT is accessible
- Check firewall rules

**Problem:** "Authentication failed"

- Verify SFTP_USERNAME and SFTP_PASSWORD are correct
- Check SFTP account has not expired
- Verify SSH key permissions (if using keys)

**Problem:** "Remote path not found"

- Ensure SFTP_REMOTE_PATH directory exists on server
- Check SFTP user has write permissions
- Verify path format (no trailing slash)

## Testing File Transfer

### Test Local Transfer

```bash
# Set local transfer only
LOCAL_TRANSFER=true
SFTP_TRANSFER=false
LOCAL_OUTPUT_PATH=test_output

npm run build
node dist/index.js

# Check file was created
ls -la test_output/
```

### Test SFTP Transfer

```bash
# Install SFTP client first
npm install ssh2-sftp-client

# Set SFTP transfer
SFTP_TRANSFER=true
SFTP_HOST=your-sftp-server
SFTP_USERNAME=test_user
SFTP_PASSWORD=test_pass
SFTP_REMOTE_PATH=/test

npm run build
node dist/index.js

# Verify file on remote server via SFTP
sftp test_user@your-sftp-server
> ls /test
```

## API Reference

See `src/fileTransfer.ts` for detailed function documentation:

- `getFileTransferConfig()` - Parse and validate configuration
- `ensureLocalDirectory()` - Create local directory if needed
- `transferFileToSftp()` - Upload file to SFTP server
- `handleFileTransfer()` - Main orchestrator function
