/**
 * Roles Module
 * Provides functions for querying and extracting role information from the Kibo API.
 * Includes helpers for working with role collections, extracting role IDs and owners.
 *
 * @module roles
 * @requires @kibocommerce/rest-sdk - Kibo Commerce SDK
 * @exports getRolesForSite - Fetch roles for a site and extract metadata
 * @exports extractRoleIds - Extract role IDs from role collection items
 * @exports extractRoleOwners - Extract role owners from role collection items
 * @exports findOwnersByRoleId - Find owners for a specific role by ID
 */

import { RoleApi } from "@kibocommerce/rest-sdk/clients/AdminUser/apis/RoleApi";
import { configuration } from "../../config";

/**
 * Shared RoleApi client instance for querying role information.
 * Uses the global configuration with authentication and headers.
 */
const roleClient = new RoleApi(configuration);

/**
 * Fetch all roles for a site and extract metadata.
 * Retrieves roles from the API and extracts role IDs and owner information.
 *
 * @async
 * @param {string} tenantId - The tenant ID (informational, not currently used in query)
 * @param {string} siteId - The site ID (informational, not currently used in query)
 * @returns {Promise<{items: any[], roleIds: number[], roleOwners: {roleId: number, owners: {id?: number, type?: string}[]}[]}>}
 *          Object containing raw items, extracted roleIds, and extracted roleOwners
 * @throws {Error} If the API call fails
 *
 * @example
 * const { items, roleIds, roleOwners } = await getRolesForSite("51679", "76103");
 * // items: [{ id: 1, name: "Admin", owners: [...] }, ...]
 * // roleIds: [1, 2, 3, ...]
 * // roleOwners: [{ roleId: 1, owners: [{id: 123, type: "User"}, ...] }, ...]
 */
export async function getRolesForSite(tenantId: string, siteId: string) {
  const rolesRequest = {
    startIndex: 0,
    pageSize: 100,
  };

  try {
    const userRoles = await roleClient.getRoles(rolesRequest);
    const items = userRoles?.items ?? [];
    const roleIds = extractRoleIds(items);
    const roleOwners = extractRoleOwners(items);
    return { items, roleIds, roleOwners };
  } catch (error) {
    console.error("getRolesForSite error", error);
    throw error;
  }
}

/**
 * Extract role IDs from a collection of role items.
 * Filters out invalid entries and returns only numeric IDs.
 *
 * @param {any[]} items - Array of role objects from API response
 * @returns {number[]} Array of role IDs
 *
 * @example
 * const roles = [{ id: 1, name: "Admin" }, { id: 2, name: "User" }];
 * const ids = extractRoleIds(roles);
 * // Returns: [1, 2]
 */
export function extractRoleIds(items: any[]): number[] {
  if (!Array.isArray(items)) return [];
  return items
    .map((r: any) => r?.id)
    .filter((id: any) => typeof id === "number");
}

/**
 * Extract role owners from a collection of role items.
 * Maps each role to its ID and list of owners with their id and type.
 *
 * @param {any[]} items - Array of role objects from API response, each with optional 'owners' array
 * @returns {{roleId: number, owners: {id?: number, type?: string}[]}[]}
 *          Array of objects containing roleId and owners array
 *
 * @example
 * const roles = [
 *   { id: 1, name: "Admin", owners: [{id: 100, type: "User"}, {id: 200, type: "Group"}] },
 *   { id: 2, name: "User", owners: [{id: 300, type: "User"}] }
 * ];
 * const owners = extractRoleOwners(roles);
 * // Returns: [
 * //   { roleId: 1, owners: [{id: 100, type: "User"}, {id: 200, type: "Group"}] },
 * //   { roleId: 2, owners: [{id: 300, type: "User"}] }
 * // ]
 */
export function extractRoleOwners(
  items: any[]
): { roleId: number; owners: { id?: number; type?: string }[] }[] {
  if (!Array.isArray(items)) return [];
  return items
    .map((r: any) => ({
      roleId: r?.id,
      owners: Array.isArray(r?.owners)
        ? r.owners.map((o: any) => ({ id: o?.id, type: o?.type }))
        : [],
    }))
    .filter((entry: any) => typeof entry.roleId === "number");
}

/**
 * Find owners for a specific role by its ID.
 * Searches the role items array for a matching role and returns its owners.
 *
 * @param {any[]} items - Array of role objects from API response
 * @param {number} roleId - The ID of the role to find owners for
 * @returns {{id?: number, type?: string}[] | undefined}
 *          Array of owner objects with id and type, or undefined if role not found
 *
 * @example
 * const roles = [
 *   { id: 1, name: "Admin", owners: [{id: 100, type: "User"}] }
 * ];
 * const owners = findOwnersByRoleId(roles, 1);
 * // Returns: [{id: 100, type: "User"}]
 *
 * const notFound = findOwnersByRoleId(roles, 999);
 * // Returns: undefined
 */
export function findOwnersByRoleId(
  items: any[],
  roleId: number
): { id?: number; type?: string }[] | undefined {
  if (!Array.isArray(items)) return undefined;
  const role = items.find((r: any) => r?.id === roleId);
  if (!role) return undefined;
  return Array.isArray(role.owners)
    ? role.owners.map((o: any) => ({ id: o?.id, type: o?.type }))
    : [];
}
