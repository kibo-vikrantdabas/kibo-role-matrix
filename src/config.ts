/**
 * Configuration Module
 * Provides centralized setup for Kibo Commerce SDK configuration and custom middleware.
 * This module initializes the Configuration object with environment variables or defaults,
 * and exports the shared middleware instance used across the application.
 *
 * Environment Variables:
 * - TENANT_ID: Kibo tenant identifier (default: "51679")
 * - SITE_ID: Kibo site identifier (default: "76103")
 * - MASTER_CATALOG: Master catalog ID (default: "1")
 * - CATALOG: Catalog ID (default: "1")
 * - CLIENT_ID: OAuth client ID (default: "KUPT.user_role_matrix.1.0.0.Release")
 * - SHARED_SECRET: OAuth shared secret (default: "280805f1840e4a5aaf68195356d731cc")
 * - PCI_HOST: PCI Host (default: "pmts.mozu.com")
 * - AUTH_HOST: Auth Host (default: "home.mozu.com")
 * - API_ENV: API environment (default: "sandbox")
 *
 * @module config
 * @exports configuration - The global Configuration instance
 * @exports userCustomMiddleware - The shared UserMiddleware instance
 */

import "dotenv/config";
import { Configuration } from "@kibocommerce/rest-sdk";
import { UserMiddleware } from "./user/role/userMiddleware";

/**
 * Create a custom middleware instance for request/response logging and direct HTTP fetches.
 * This is shared across all API clients in the application.
 */
const userCustomMiddleware = new UserMiddleware();

/**
 * Global Kibo Commerce SDK configuration instance.
 * Configured with environment variables or sensible defaults.
 * Includes the custom middleware for request/response interception and logging.
 *
 * @type {Configuration}
 */
export const configuration = new Configuration({
  tenantId: process.env.KIBO_TENANT || process.env.TENANT_ID || "100016",
  siteId: process.env.KIBO_SITE || process.env.SITE_ID || "100148",
  masterCatalog:
    process.env.KIBO_MASTER_CATALOG || process.env.MASTER_CATALOG || "2",
  catalog: process.env.KIBO_CATALOG || process.env.CATALOG || "5",
  clientId:
    process.env.KIBO_CLIENT_ID ||
    process.env.CLIENT_ID ||
    "afg.data_connector.1.0.0.Release",
  sharedSecret:
    process.env.KIBO_SHARED_SECRET ||
    process.env.SHARED_SECRET ||
    "91faf1355b0e4718b95a37a732c9fae5",
  pciHost:
    process.env.KIBO_PCI_HOST ||
    process.env.PCI_HOST ||
    "pmts.euw1.kibocommerce.com",
  authHost:
    process.env.KIBO_AUTH_HOST ||
    process.env.AUTH_HOST ||
    "home.euw1.kibocommerce.com",
  apiEnv: process.env.KIBO_API_ENV || process.env.API_ENV || "sandbox",
  middleware: [userCustomMiddleware],
});

/** Export the shared middleware instance for use in other modules. */
export { userCustomMiddleware };
