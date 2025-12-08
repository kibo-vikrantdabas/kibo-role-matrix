/**
 * Users Module
 * Provides functions for fetching user data from Kibo Commerce across tenants and sites.
 * Includes pagination support, batch processing, and role enrichment functionality.
 *
 * @module users
 * @requires @kibocommerce/rest-sdk - Kibo Commerce SDK
 * @exports getUsersForSite - Fetch users for a site with custom request parameters
 * @exports getUserBySite - Fetch users for a site with default parameters
 * @exports fetchAllTenantUsers - Fetch all users across all sites in a tenant with pagination
 * @exports fetchAllTenantUsersWithRoles - Fetch all users and enrich with role information
 */

import { AdminUserApi } from "@kibocommerce/rest-sdk/clients/AdminUser/apis/AdminUserApi";
import { configuration, userCustomMiddleware } from "../../config";
import { UserRoleService } from "./userRoleService";

/**
 * Shared AdminUserApi client instance for querying user information.
 * Uses the global configuration with authentication and headers.
 */
const adminUserClient = new AdminUserApi(configuration);
// Instance of the service that performs direct AdminUser API fetches
const userRoleService = new UserRoleService();

/**
 * Fetch users for a site with custom request parameters.
 * Delegates to middleware direct fetch helper to bypass SDK wrapper.
 *
 * @async
 * @param {any} requestParams - Request parameters object
 *   @param {number} requestParams.startIndex - Zero-based start index for pagination
 *   @param {number} requestParams.pageSize - Number of results per page
 *   @param {string} requestParams.responseFields - Comma-separated list of fields to return
 * @returns {Promise<any>} Response object or array of users
 * @throws {Error} If API call fails
 *
 * @example
 * const users = await getUsersForSite({
 *   startIndex: 0,
 *   pageSize: 50,
 *   responseFields: "emailAddress,firstName,lastName,id"
 * });
 */
export async function getUsersForSite(requestParams: any) {
  // Delegate to middleware helper which performs direct fetch and includes auth headers
  return await userRoleService.fetchUsersDirect(
    configuration,
    adminUserClient,
    requestParams
  );
}

/**
 * Fetch users for a site with default request parameters.
 * Uses sensible defaults for pagination and response fields.
 *
 * @async
 * @returns {Promise<any>} Response object or array of users
 * @throws {Error} If API call fails
 *
 * @example
 * const users = await getUserBySite();
 * // Returns users with emailAddress field, 20 per page
 */
export async function getUserBySite() {
  return await getUsersForSite({
    startIndex: 0,
    pageSize: 20,
    responseFields: "emailAddress",
  });
}

/**
 * Fetch all users across all sites for a tenant with pagination.
 * Retrieves site IDs for the tenant, then pages through users for each site
 * in batches of 50. Preserves the original site context before and after.
 *
 * @async
 * @param {string} tenantId - The tenant ID to fetch users for (e.g., "51679")
 * @returns {Promise<Array<any>>} Array of user objects with properties:
 *   - id: User ID
 *   - email: User email address
 *   - firstName: User's first name
 *   - lastName: User's last name
 *   - siteId: The site ID where the user was found
 * @throws Does not throw; logs errors and continues to next site
 *
 * @description
 * Process:
 * 1. Fetch all site IDs for the tenant
 * 2. For each site:
 *    a. Set site context in configuration for proper headers
 *    b. Page through users in batches of 50
 *    c. Collect user data until no more results
 * 3. Restore original site context
 * 4. Return collected user array
 *
 * @example
 * const users = await fetchAllTenantUsers("51679");
 * // Returns: [
 * //   { id: 1, email: "user1@example.com", firstName: "John", ... },
 * //   { id: 2, email: "user2@example.com", firstName: "Jane", ... },
 * //   ...
 * // ]
 */
export async function fetchAllTenantUsers(
  tenantId: string
): Promise<Array<any>> {
  const pageSize = 50;
  const collected: Array<any> = [];

  // Determine configured siteId (prefer KIBO_SITE env, then configuration)
  const envSite = process.env.KIBO_SITE || process.env.SITE_ID;
  const configuredSiteId =
    envSite ||
    (configuration as any).context?.context?.siteId ||
    (configuration as any).siteId;

  // Remember original siteId to restore after processing
  const originalSiteId = (configuration as any).context?.context?.siteId;

  const siteId = configuredSiteId;
  try {
    // Set site context so API headers include the correct x-vol-site
    if (
      (configuration as any).context &&
      (configuration as any).context.context
    ) {
      (configuration as any).context.context.siteId = siteId;
    }

    // Page through users for this single configured site
    let startIndex = 0;
    while (true) {
      const userRequest = {
        startIndex,
        pageSize,
        responseFields: "emailAddress,firstName,lastName,id",
      };

      // Fetch page of users via the shared middleware helper
      const data = await userRoleService.fetchUsersDirect(
        configuration,
        adminUserClient,
        userRequest
      );

      // Handle both array and { items: [] } response formats
      const items = Array.isArray(data) ? data : data?.items ?? [];
      if (!Array.isArray(items) || items.length === 0) break;

      // Collect user records from this page
      for (const u of items) {
        collected.push({
          id: u?.id,
          email: u?.emailAddress ?? u?.email,
          firstName: u?.firstName,
          lastName: u?.lastName,
          siteId,
        });
      }

      // Stop pagination if fewer results than page size
      if (items.length < pageSize) break;
      startIndex += pageSize;
    }
  } catch (err) {
    console.error(`Failed to collect users for site ${siteId}`, err);
  }

  // Restore original site context
  if (
    (configuration as any).context &&
    (configuration as any).context.context
  ) {
    (configuration as any).context.context.siteId = originalSiteId;
  }

  return collected;
}

/**
 * Fetch all users across all sites for a tenant and enrich with role information.
 * Combines user data with their assigned roles and returns as array-of-arrays
 * suitable for CSV/Excel export.
 *
 * @async
 * @param {string} tenantId - The tenant ID to process (e.g., "51679")
 * @returns {Promise<string>} Path to the created CSV file (e.g., "users-51679-01-12-2025-14-30-45-1234.csv")
 * @throws Does not throw; logs errors per user and marks failed roles as "ERROR"
 *
 * @description
 * Process:
 * 1. Fetch all users using fetchAllTenantUsers()
 * 2. For each user:
 *    a. Query their assigned roles
 *    b. Extract role names and join with semicolon
 *    c. Create row: [email, firstName, lastName, id, roles]
 * 3. Write rows to CSV file with proper escaping
 * 4. Return file path
 *
 * @example
 * const csvPath = await fetchAllTenantUsersWithRoles("51679");
 * // File contents:
 * // "email","firstName","lastName","id","roles"
 * // "user1@example.com","John","Doe","1","Admin;SuperAdmin"
 * // "user2@example.com","Jane","Smith","2","User"
 * // Returns: "users-51679-01-12-2025-14-30-45-1234.csv"
 */
export async function fetchAllTenantUsersWithRoles(
  tenantId: string
): Promise<Array<Array<string>>> {
  // Fetch all users from all sites
  const users = await fetchAllTenantUsers(tenantId);

  // Initialize rows array with header
  const rows: Array<Array<string>> = [];
  rows.push(["email", "firstName", "lastName", "id", "roles"]);

  // Process each user
  for (const u of users) {
    const userId = u?.id;
    if (!userId) {
      console.warn("Skipping user with no id", u);
      continue;
    }

    try {
      // Fetch roles for this user
      const rolesResp = await adminUserClient.getUserRoles({
        userId: String(userId),
      });
      const items = rolesResp?.items ?? [];
      const roleNames = items
        .map((r: any) => r?.roleName)
        .filter((x: any) => !!x);

      // Add user row with roles joined by semicolon
      rows.push([
        u.email || "",
        u.firstName || "",
        u.lastName || "",
        String(userId),
        roleNames.join(";"),
      ]);
    } catch (err) {
      console.error(`Failed to fetch roles for user ${userId}`, err);
      // Add row with ERROR marker for failed role lookup
      rows.push([
        u.email || "",
        u.firstName || "",
        u.lastName || "",
        String(userId),
        "ERROR",
      ]);
    }
  }

  return rows;
}
