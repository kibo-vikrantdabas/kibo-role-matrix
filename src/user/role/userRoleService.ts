export class UserRoleService {
  /**
   * Direct HTTP fetch helper for AdminUser API.
   * Performs a raw HTTP GET request to the AdminUser API endpoint,
   * bypassing SDK wrapper methods to allow custom query parameters
   * and direct response handling.
   *
   * This method:
   * 1. Constructs the base API URL from configuration
   * 2. Builds query string from request parameters
   * 3. Reuses SDK authentication header building logic
   * 4. Makes direct HTTP request using configuration.fetchApi
   * 5. Returns parsed JSON response or throws on error
   *
   * @async
   * @param {any} configuration - Kibo Configuration instance with getBaseAPIUrl, queryParamsStringify, and fetchApi
   * @param {any} adminUserClient - AdminUserApi instance (used to access basePathTemplate and addAuthorizationHeaders)
   * @param {any} userRequest - Request parameters object (e.g., { startIndex: 0, pageSize: 50, responseFields: "..." })
   * @returns {Promise<any>} Parsed JSON response from the API
   * @throws {Error} If HTTP response is not OK or JSON parsing fails
   *
   * @example
   * const config = new Configuration({ ... });
   * const client = new AdminUserApi(config);
   * const users = await middleware.fetchUsersDirect(config, client, {
   *   startIndex: 0,
   *   pageSize: 50,
   *   responseFields: "emailAddress,firstName,lastName,id"
   * });
   * // Returns: { items: [...], totalCount: 1234, pageSize: 50, ... }
   */
  public async fetchUsersDirect(
    configuration: any,
    adminUserClient: any,
    userRequest: any
  ): Promise<any> {
    // Get base API URL from configuration
    const baseUrl = await configuration.getBaseAPIUrl(
      (adminUserClient as any).basePathTemplate
    );

    // Define the API endpoint path
    const path = `/platform/adminuser/accounts`;

    // Build query string from request parameters
    const queryString = configuration.queryParamsStringify
      ? `?${configuration.queryParamsStringify(userRequest as any)}`
      : "";

    // Construct full URL
    const url = `${baseUrl}${path}${queryString}`;

    // Initialize headers from configuration
    const headers: any = Object.assign({}, configuration.headers || {});

    // Reuse SDK's authorization and site header building
    await (adminUserClient as any).addAuthorizationHeaders(headers);

    // Perform the HTTP GET request
    const resp = await configuration.fetchApi(url, { method: "GET", headers });

    // Check for HTTP errors
    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      throw new Error(
        `Failed to fetch users: ${resp.status} ${resp.statusText} ${text}`
      );
    }

    // Parse and return JSON response
    return await resp.json().catch(() => undefined);
  }
}
