/**
 * Tenants Module
 * Provides functions for querying Kibo tenant and site information.
 *
 * @module tenants
 * @requires @kibocommerce/rest-sdk - Kibo Commerce SDK
 * @exports getTenantSites - Fetch all site IDs for a given tenant
 */

import { TenantsApi } from "@kibocommerce/rest-sdk/clients/Tenant/apis/TenantsApi";
import { configuration } from "../../config";

/**
 * Fetch all site IDs for a given tenant.
 * Queries the Tenants API to retrieve the tenant details and extracts
 * the list of site IDs associated with the tenant.
 *
 * @async
 * @param {string} tenantId - The tenant ID to query (e.g., "51679")
 * @returns {Promise<number[]>} Array of site IDs, or empty array if error occurs
 * @throws Does not throw; returns empty array on error and logs the error
 *
 * @example
 * const siteIds = await getTenantSites("51679");
 * // Returns: [76103, 76560, 76561, ...]
 *
 * @description
 * Process:
 * 1. Create a new TenantsApi client with the global configuration
 * 2. Build request parameters with the tenant ID and 'sites' responseFields
 * 3. Call getTenant() to fetch tenant details
 * 4. Extract the 'id' field from each site in the response
 * 5. Return the array of site IDs or empty array on failure
 */
export async function getTenantSites(tenantId: string): Promise<number[]> {
  const tenantClient = new TenantsApi(configuration);
  const tenantParams = {
    tenantId: parseInt(tenantId),
    responseFields: "sites",
  };

  try {
    const tenantDetails = await tenantClient.getTenant(tenantParams);
    // Safely extract site IDs from response
    const siteIds: number[] = tenantDetails?.sites?.map((s: any) => s.id) ?? [];
    return siteIds;
  } catch (error) {
    console.error("getTenantSites error", error);
    return [];
  }
}
